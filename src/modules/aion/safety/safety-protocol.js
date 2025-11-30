/**
 * AION Safety Protocol
 * Implements micro-commit system with rollback capability
 */

const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class SafetyProtocol {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.commitTracker = [];
    this.rollbackManager = new RollbackManager(projectRoot);
    this.validationGates = new ValidationGates();
  }

  /**
   * Execute micro-commit with validation
   */
  async microCommit(persona, stepId, description, changes = {}) {
    console.log(chalk.blue(`🛡️  Micro-commit: [${persona}] [${stepId}] ${description}`));
    
    try {
      // Validate changes before committing
      await this.validationGates.validate(changes);
      
      // Create commit record
      const commit = {
        id: this.generateCommitId(persona, stepId),
        persona: persona,
        stepId: stepId,
        description: description,
        changes: changes,
        timestamp: new Date(),
        hash: this.generateHash(changes),
        status: 'committed',
        rollbackPoint: await this.createRollbackPoint(changes)
      };
      
      // Track commit
      this.commitTracker.push(commit);
      
      // Save commit tracker
      await this.saveCommitTracker();
      
      // Execute the actual changes
      await this.executeChanges(changes);
      
      console.log(chalk.green(`✅ Micro-commit successful: ${commit.id}`));
      return commit;
      
    } catch (error) {
      console.error(chalk.red(`❌ Micro-commit failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Rollback to a specific commit
   */
  async rollback(commitId) {
    console.log(chalk.blue(`🔄 Rolling back to commit: ${commitId}`));
    
    try {
      const commit = this.findCommit(commitId);
      if (!commit) {
        throw new Error(`Commit ${commitId} not found`);
      }
      
      // Execute rollback
      const result = await this.rollbackManager.rollback(commit);
      
      // Update commit status
      commit.status = 'rolled_back';
      commit.rollbackTimestamp = new Date();
      
      // Save updated tracker
      await this.saveCommitTracker();
      
      console.log(chalk.green(`✅ Rollback completed: ${commitId}`));
      return result;
      
    } catch (error) {
      console.error(chalk.red(`❌ Rollback failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get commit history
   */
  getCommitHistory(limit = 20) {
    return this.commitTracker.slice(-limit);
  }

  /**
   * Find commit by ID
   */
  findCommit(commitId) {
    return this.commitTracker.find(commit => commit.id === commitId);
  }

  /**
   * Get commits by persona
   */
  getCommitsByPersona(persona, limit = 10) {
    return this.commitTracker
      .filter(commit => commit.persona === persona)
      .slice(-limit);
  }

  /**
   * Generate unique commit ID
   */
  generateCommitId(persona, stepId) {
    return `${persona}-${stepId}-${Date.now()}`;
  }

  /**
   * Generate hash for changes
   */
  generateHash(changes) {
    const content = JSON.stringify(changes, Object.keys(changes).sort());
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
  }

  /**
   * Create rollback point
   */
  async createRollbackPoint(changes) {
    return await this.rollbackManager.createPoint(changes);
  }

  /**
   * Execute changes
   */
  async executeChanges(changes) {
    // TODO: Implement change execution logic
    // This would depend on the type of changes (file operations, API calls, etc.)
    
    if (changes.files) {
      for (const fileChange of changes.files) {
        await this.executeFileChange(fileChange);
      }
    }
    
    if (changes.api) {
      for (const apiCall of changes.api) {
        await this.executeApiCall(apiCall);
      }
    }
  }

  /**
   * Execute file change
   */
  async executeFileChange(fileChange) {
    const filePath = path.join(this.projectRoot, fileChange.path);
    
    switch (fileChange.action) {
      case 'create':
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, fileChange.content, 'utf8');
        break;
        
      case 'update':
        await fs.writeFile(filePath, fileChange.content, 'utf8');
        break;
        
      case 'delete':
        await fs.remove(filePath);
        break;
        
      default:
        throw new Error(`Unknown file action: ${fileChange.action}`);
    }
  }

  /**
   * Execute API call
   */
  async executeApiCall(apiCall) {
    // TODO: Implement API call execution
    console.log(chalk.blue(`📡 Executing API call: ${apiCall.method} ${apiCall.endpoint}`));
  }

  /**
   * Save commit tracker
   */
  async saveCommitTracker() {
    const trackerPath = path.join(this.projectRoot, '.aion', 'commit-tracker.json');
    await fs.ensureDir(path.dirname(trackerPath));
    await fs.writeJSON(trackerPath, this.commitTracker, { spaces: 2 });
  }

  /**
   * Load commit tracker
   */
  async loadCommitTracker() {
    const trackerPath = path.join(this.projectRoot, '.aion', 'commit-tracker.json');
    
    try {
      if (await fs.pathExists(trackerPath)) {
        this.commitTracker = await fs.readJSON(trackerPath);
      }
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not load commit tracker: ${error.message}`));
      this.commitTracker = [];
    }
  }

  /**
   * Get safety statistics
   */
  getStatistics() {
    const stats = {
      totalCommits: this.commitTracker.length,
      commitsByPersona: {},
      commitsByStatus: {},
      averageCommitsPerSession: 0,
      rollbackRate: 0
    };

    // Calculate commits by persona
    for (const commit of this.commitTracker) {
      stats.commitsByPersona[commit.persona] = (stats.commitsByPersona[commit.persona] || 0) + 1;
      stats.commitsByStatus[commit.status] = (stats.commitsByStatus[commit.status] || 0) + 1;
    }

    // Calculate rollback rate
    const rolledBackCommits = stats.commitsByStatus['rolled_back'] || 0;
    stats.rollbackRate = this.commitTracker.length > 0 ? 
      (rolledBackCommits / this.commitTracker.length) * 100 : 0;

    return stats;
  }
}

/**
 * Rollback Manager
 */
class RollbackManager {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.rollbackPointsPath = path.join(projectRoot, '.aion', 'rollback-points');
  }

  /**
   * Create rollback point
   */
  async createPoint(changes) {
    const pointId = this.generatePointId();
    const pointPath = path.join(this.rollbackPointsPath, `${pointId}.json`);
    
    await fs.ensureDir(this.rollbackPointsPath);
    
    const rollbackPoint = {
      id: pointId,
      timestamp: new Date(),
      changes: changes,
      state: await this.captureCurrentState(changes)
    };
    
    await fs.writeJSON(pointPath, rollbackPoint, { spaces: 2 });
    
    return pointId;
  }

  /**
   * Rollback to a specific commit
   */
  async rollback(commit) {
    if (!commit.rollbackPoint) {
      throw new Error('No rollback point available for this commit');
    }
    
    const pointPath = path.join(this.rollbackPointsPath, `${commit.rollbackPoint}.json`);
    
    if (!(await fs.pathExists(pointPath))) {
      throw new Error(`Rollback point ${commit.rollbackPoint} not found`);
    }
    
    const rollbackPoint = await fs.readJSON(pointPath);
    
    // Restore state
    await this.restoreState(rollbackPoint.state);
    
    return rollbackPoint;
  }

  /**
   * Capture current state
   */
  async captureCurrentState(changes) {
    const state = {};
    
    if (changes.files) {
      state.files = {};
      for (const fileChange of changes.files) {
        const filePath = path.join(this.projectRoot, fileChange.path);
        
        if (await fs.pathExists(filePath)) {
          state.files[fileChange.path] = {
            exists: true,
            content: await fs.readFile(filePath, 'utf8'),
            stats: await fs.stat(filePath)
          };
        } else {
          state.files[fileChange.path] = {
            exists: false
          };
        }
      }
    }
    
    return state;
  }

  /**
   * Restore state
   */
  async restoreState(state) {
    if (state.files) {
      for (const [filePath, fileInfo] of Object.entries(state.files)) {
        const fullPath = path.join(this.projectRoot, filePath);
        
        if (fileInfo.exists) {
          await fs.ensureDir(path.dirname(fullPath));
          await fs.writeFile(fullPath, fileInfo.content, 'utf8');
        } else {
          await fs.remove(fullPath);
        }
      }
    }
  }

  /**
   * Generate rollback point ID
   */
  generatePointId() {
    return `rollback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Validation Gates
 */
class ValidationGates {
  constructor() {
    this.validators = [
      new FileValidator(),
      new ContentValidator(),
      new SecurityValidator()
    ];
  }

  /**
   * Validate changes
   */
  async validate(changes) {
    console.log(chalk.blue('🔍 Running validation gates...'));
    
    for (const validator of this.validators) {
      await validator.validate(changes);
    }
    
    console.log(chalk.green('✅ All validation gates passed'));
  }
}

/**
 * File Validator
 */
class FileValidator {
  async validate(changes) {
    if (changes.files) {
      for (const fileChange of changes.files) {
        if (fileChange.path.includes('..')) {
          throw new Error('Path traversal detected');
        }
        
        if (fileChange.content && typeof fileChange.content !== 'string') {
          throw new Error('File content must be a string');
        }
      }
    }
  }
}

/**
 * Content Validator
 */
class ContentValidator {
  async validate(changes) {
    // TODO: Implement content validation
    // This could check for malicious content, syntax errors, etc.
  }
}

/**
 * Security Validator
 */
class SecurityValidator {
  async validate(changes) {
    // TODO: Implement security validation
    // This could check for secrets, API keys, etc.
  }
}

module.exports = SafetyProtocol;
