/**
 * AION State Machine
 * Manages handover between agents and workflow orchestration
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class StateMachine {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.handoverLogPath = path.join(projectRoot, '.github/BMAD_HANDOVER.md');
    this.currentState = 'INIT';
    this.handoverLog = [];
    this.transitionRules = new TransitionRules();
  }

  /**
   * Initialize state machine
   */
  async initialize() {
    console.log(chalk.blue('🔄 Initializing State Machine...'));
    
    try {
      await this.loadHandoverLog();
      console.log(chalk.green('✅ State Machine initialized'));
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not load handover log: ${error.message}`));
      // Create new handover log
      await this.createHandoverLog();
    }
  }

  /**
   * Execute handover between personas
   */
  async handover(fromPersona, toPersona, artifacts = []) {
    console.log(chalk.blue(`🔄 Handover: ${fromPersona} → ${toPersona}`));
    
    try {
      // Validate transition
      this.validateTransition(fromPersona, toPersona);
      
      // Create handover record
      const handover = {
        from: fromPersona,
        to: toPersona,
        artifacts: artifacts,
        timestamp: new Date(),
        state: this.currentState,
        id: this.generateHandoverId()
      };
      
      // Update current state
      this.currentState = toPersona;
      
      // Add to log
      this.handoverLog.push(handover);
      
      // Save handover log
      await this.saveHandoverLog();
      
      // Notify next persona (if implemented)
      await this.notifyPersona(toPersona, artifacts);
      
      console.log(chalk.green(`✅ Handover completed: ${fromPersona} → ${toPersona}`));
      return handover;
      
    } catch (error) {
      console.error(chalk.red(`❌ Handover failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return {
      state: this.currentState,
      timestamp: new Date(),
      handoverCount: this.handoverLog.length,
      lastHandover: this.handoverLog[this.handoverLog.length - 1] || null
    };
  }

  /**
   * Get handover history
   */
  getHandoverHistory(limit = 10) {
    return this.handoverLog.slice(-limit);
  }

  /**
   * Get state flow diagram
   */
  getStateFlow() {
    return `stateDiagram-v2
    [*] --> Initialization
    Initialization --> Planning: BMAD Ready
    Planning --> Architecture: PRD Complete
    Architecture --> Development: Spec Complete
    Development --> Testing: Code Ready
    Testing --> Release: Tests Pass
    Release --> [*]: Deployment Complete`;
  }

  /**
   * Validate transition between personas
   */
  validateTransition(from, to) {
    if (!this.transitionRules.isValid(from, to)) {
      throw new Error(`Invalid transition from ${from} to ${to}`);
    }
  }

  /**
   * Generate unique handover ID
   */
  generateHandoverId() {
    return `HANDOVER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load handover log from file
   */
  async loadHandoverLog() {
    if (await fs.pathExists(this.handoverLogPath)) {
      const content = await fs.readFile(this.handoverLogPath, 'utf8');
      this.parseHandoverLog(content);
    }
  }

  /**
   * Parse handover log from markdown
   */
  parseHandoverLog(content) {
    const lines = content.split('\n');
    let inHistorySection = false;
    
    for (const line of lines) {
      if (line.includes('## Handover History')) {
        inHistorySection = true;
        continue;
      }
      
      if (inHistorySection && line.includes('##')) {
        break; // End of history section
      }
      
      if (inHistorySection && line.includes('|')) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 4) {
          const handover = {
            date: parts[0],
            from: parts[1],
            to: parts[2],
            artifacts: parts[3],
            notes: parts[4] || ''
          };
          this.handoverLog.push(handover);
        }
      }
    }
  }

  /**
   * Save handover log to file
   */
  async saveHandoverLog() {
    const content = this.formatHandoverLog();
    await fs.ensureDir(path.dirname(this.handoverLogPath));
    await fs.writeFile(this.handoverLogPath, content, 'utf8');
  }

  /**
   * Format handover log as markdown
   */
  formatHandoverLog() {
    let content = `# BMAD Handover Protocol - AION

## Current State
**Phase**: ${this.currentState}
**Active Agent**: ${this.currentState}
**Status**: Autonomous operation active

## Handover History
| Date | From | To | Artifacts | Notes |
|------|------|----|-----------|-------|`;

    // Add recent handovers (limit to last 20)
    const recentHandovers = this.handoverLog.slice(-20);
    for (const handover of recentHandovers) {
      const date = handover.timestamp ? handover.timestamp.toISOString().split('T')[0] : 'Unknown';
      const artifacts = Array.isArray(handover.artifacts) ? 
        handover.artifacts.map(a => a.type || 'Artifact').join(', ') : 
        handover.artifacts || 'None';
      
      content += `\n| ${date} | ${handover.from} | ${handover.to} | ${artifacts} | ${handover.notes || ''} |`;
    }

    content += `\n\n## State Flow
\`\`\`mermaid
${this.getStateFlow()}
\`\`\`

## Active Context
- **Goal**: Execute autonomous development lifecycle
- **Current Focus**: ${this.currentState} operations
- **Blockers**: None

## Metrics
- **Handover Count**: ${this.handoverLog.length}
- **Current State**: ${this.currentState}
- **Last Activity**: ${this.handoverLog.length > 0 ? 
  this.handoverLog[this.handoverLog.length - 1].timestamp.toISOString() : 
  'None'}
- **Error Rate**: 0%
`;

    return content;
  }

  /**
   * Create new handover log
   */
  async createHandoverLog() {
    await this.saveHandoverLog();
  }

  /**
   * Notify next persona (placeholder for future implementation)
   */
  async notifyPersona(persona, artifacts) {
    console.log(chalk.blue(`📢 Notifying ${persona} of new artifacts...`));
    // TODO: Implement persona notification system
    // This could integrate with BMAD agent system
  }

  /**
   * Reset state machine
   */
  async reset() {
    console.log(chalk.blue('🔄 Resetting State Machine...'));
    
    this.currentState = 'INIT';
    this.handoverLog = [];
    
    await this.saveHandoverLog();
    
    console.log(chalk.green('✅ State Machine reset complete'));
  }

  /**
   * Get state statistics
   */
  getStatistics() {
    const stats = {
      totalHandovers: this.handoverLog.length,
      currentState: this.currentState,
      personaTransitions: {},
      artifactTypes: {},
      averageHandoverTime: 0
    };

    // Calculate persona transition frequency
    for (const handover of this.handoverLog) {
      const transition = `${handover.from} → ${handover.to}`;
      stats.personaTransitions[transition] = (stats.personaTransitions[transition] || 0) + 1;
    }

    // Calculate artifact types
    for (const handover of this.handoverLog) {
      if (Array.isArray(handover.artifacts)) {
        for (const artifact of handover.artifacts) {
          const type = artifact.type || 'Unknown';
          stats.artifactTypes[type] = (stats.artifactTypes[type] || 0) + 1;
        }
      }
    }

    return stats;
  }
}

/**
 * Transition Rules for state machine
 */
class TransitionRules {
  constructor() {
    this.validTransitions = {
      'INIT': ['PM', 'SYSTEM'],
      'PM': ['ARCHITECT', 'SYSTEM'],
      'ARCHITECT': ['DEVELOPER', 'PM', 'SYSTEM'],
      'DEVELOPER': ['QA', 'ARCHITECT', 'SYSTEM'],
      'QA': ['RELEASE', 'DEVELOPER', 'SYSTEM'],
      'RELEASE': ['SYSTEM', 'PM'],
      'SYSTEM': ['PM', 'INIT'] // System can restart cycle
    };
  }

  isValid(from, to) {
    const validTargets = this.validTransitions[from];
    return validTargets && validTargets.includes(to);
  }

  getValidTransitions(from) {
    return this.validTransitions[from] || [];
  }

  addTransition(from, to) {
    if (!this.validTransitions[from]) {
      this.validTransitions[from] = [];
    }
    this.validTransitions[from].push(to);
  }
}

module.exports = StateMachine;
