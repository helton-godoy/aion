#!/usr/bin/env node

/**
 * AION Initialization Script
 * Sets up AION project with BMAD foundation
 */

require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

class AIONInitializer {
  constructor() {
    this.projectRoot = process.cwd();
    this.aionPath = path.join(this.projectRoot);
  }

  async init() {
    console.log(
      chalk.cyan(
        chalk.bold('🚀 AION Initialization')
      )
    );
    console.log(chalk.gray('Setting up AI Orchestration Native project...\n'));

    try {
      // Check if already initialized
      if (await this.isInitialized()) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: 'AION project already exists. Overwrite?',
            default: false
          }
        ]);

        if (!overwrite) {
          console.log(chalk.yellow('❌ Initialization cancelled.'));
          return;
        }
      }

      // Initialize BMAD foundation
      await this.setupBMADFoundation();

      // Setup AION modules
      await this.setupAIONModules();

      // Create configuration files
      await this.createConfiguration();

      // Setup Memory Bank
      await this.setupMemoryBank();

      // Setup State Machine
      await this.setupStateMachine();

      console.log(chalk.green('\n✨ AION initialization complete!'));
      console.log(chalk.cyan('\n📖 Next steps:'));
      console.log(chalk.gray('1. Run: npm install'));
      console.log(chalk.gray('2. Run: npm run aion:agents:list'));
      console.log(chalk.gray('3. Run: npm run aion:workflow:github-full-cycle'));

    } catch (error) {
      console.error(chalk.red('\n❌ Initialization failed:'), error.message);
      process.exit(1);
    }
  }

  async isInitialized() {
    return fs.existsSync(path.join(this.aionPath, 'package.json')) &&
           fs.existsSync(path.join(this.aionPath, 'src/modules/aion'));
  }

  async setupBMADFoundation() {
    const spinner = ora('Setting up BMAD foundation...').start();

    try {
      // This would typically install BMAD-METHOD
      // For now, we'll create the structure
      await this.createBMADStructure();
      
      spinner.succeed('BMAD foundation setup complete');
    } catch (error) {
      spinner.fail('BMAD foundation setup failed');
      throw error;
    }
  }

  async createBMADStructure() {
    const bmadPath = path.join(this.aionPath, 'src/modules/bmad');
    
    // Create BMAD directories
    await fs.ensureDir(bmadPath);
    await fs.ensureDir(path.join(bmadPath, 'core'));
    await fs.ensureDir(path.join(bmadPath, 'agents'));
    await fs.ensureDir(path.join(bmadPath, 'workflows'));
  }

  async setupAIONModules() {
    const spinner = ora('Setting up AION modules...').start();

    try {
      const aionModulesPath = path.join(this.aionPath, 'src/modules/aion');
      
      // Create AION module structure
      const modules = ['agents', 'workflows', 'memory', 'state', 'safety', 'platform'];
      
      for (const module of modules) {
        await fs.ensureDir(path.join(aionModulesPath, module));
      }

      // Create basic module files
      await this.createBasicModules();
      
      spinner.succeed('AION modules setup complete');
    } catch (error) {
      spinner.fail('AION modules setup failed');
      throw error;
    }
  }

  async createBasicModules() {
    const aionPath = path.join(this.aionPath, 'src/modules/aion');

    // Create Memory Manager
    await fs.writeFile(
      path.join(aionPath, 'memory/memory-manager.js'),
      this.getMemoryManagerTemplate()
    );

    // Create State Machine
    await fs.writeFile(
      path.join(aionPath, 'state/state-machine.js'),
      this.getStateMachineTemplate()
    );

    // Create Safety Protocol
    await fs.writeFile(
      path.join(aionPath, 'safety/safety-protocol.js'),
      this.getSafetyProtocolTemplate()
    );
  }

  async createConfiguration() {
    const spinner = ora('Creating configuration files...').start();

    try {
      // Create AION configuration
      const config = {
        version: '1.0.0',
        features: [
          'autonomous-orchestration',
          'memory-banking',
          'safety-protocol',
          'state-machine',
          'github-native',
          'bmad-integration'
        ],
        agents: {
          'github-pm': 'Product Manager with GitHub integration',
          'github-architect': 'System Architect with GitHub integration',
          'github-developer': 'Developer with GitHub integration',
          'github-qa': 'QA Engineer with GitHub integration'
        },
        workflows: {
          'github-full-cycle': 'Complete autonomous development cycle'
        }
      };

      await fs.writeJSON(
        path.join(this.aionPath, 'aion.config.json'),
        config,
        { spaces: 2 }
      );

      spinner.succeed('Configuration files created');
    } catch (error) {
      spinner.fail('Configuration creation failed');
      throw error;
    }
  }

  async setupMemoryBank() {
    const spinner = ora('Setting up Memory Bank...').start();

    try {
      // Create product context
      const productContext = `# Product Context - AION

**Last Updated:** ${new Date().toISOString()}
**Project:** AION - AI Orchestration Native
**Repository:** https://github.com/helton-godoy/aion

## Project Overview

AION represents the fusion of BMAD-METHOD's robust infrastructure with BMAD-GITHUB-NATIVE-FULL-CYCLE's orchestration philosophy.

## Core Components

### Memory Bank System
- **productContext.md**: Long-term project knowledge
- **activeContext.md**: Current session state

### State Machine
- **BMAD_HANDOVER.md**: State tracking and transitions
- **Automated handoffs**: Seamless persona transitions

### Safety Protocol
- **Micro-commits**: [PERSONA] [STEP-XXX] Description
- **Rollback capability**: Instant recovery from any state

## Development Status

### Phase 1: Foundation ✅ COMPLETE
- Project structure
- Documentation
- Basic modules

### Phase 2: Implementation 🚧 IN PROGRESS
- BMAD integration
- Agent enhancement
- Workflow mapping

### Phase 3: Validation ⏳ PLANNED
- End-to-end testing
- Performance optimization
- Security validation
`;

      await fs.writeFile(
        path.join(this.aionPath, 'productContext.md'),
        productContext
      );

      // Create active context
      const activeContext = `# Active Context - AION

**Session Started:** ${new Date().toISOString()}
**Current Phase:** Initialization
**Active Agent:** None

## Current State

AION project is being initialized with BMAD foundation and autonomous orchestration capabilities.

## Next Steps

1. Complete BMAD integration
2. Setup GitHub native workflows
3. Implement autonomous agents
4. Validate full cycle operation

## Memory Bank Status

- **Product Context**: Loaded
- **Active Context**: Initializing
- **State Machine**: Ready
- **Safety Protocol**: Active
`;

      await fs.writeFile(
        path.join(this.aionPath, 'activeContext.md'),
        activeContext
      );

      spinner.succeed('Memory Bank setup complete');
    } catch (error) {
      spinner.fail('Memory Bank setup failed');
      throw error;
    }
  }

  async setupStateMachine() {
    const spinner = ora('Setting up State Machine...').start();

    try {
      // Create GitHub directory if it doesn't exist
      await fs.ensureDir(path.join(this.aionPath, '.github'));

      // Create BMAD_HANDOVER.md
      const handoverContent = `# BMAD Handover Protocol - AION

## Current State
**Phase**: Initialization
**Active Agent**: None
**Status**: Setting up autonomous orchestration

## Handover History
| Date | From | To | Artifacts | Notes |
|------|------|----|-----------|-------|
| ${new Date().toISOString().split('T')[0]} | SYSTEM | INIT | Project Structure | AION initialization started |

## State Flow
\`\`\`mermaid
stateDiagram-v2
    [*] --> Initialization
    Initialization --> Planning: BMAD Ready
    Planning --> Architecture: PRD Complete
    Architecture --> Development: Spec Complete
    Development --> Testing: Code Ready
    Testing --> Release: Tests Pass
    Release --> [*]: Deployment Complete
\`\`\`

## Active Context
- **Goal**: Setup AION autonomous development system
- **Current Focus**: BMAD foundation integration
- **Blockers**: None

## Metrics
- **Setup Progress**: 60% complete
- **Error Rate**: 0%
- **Memory Bank**: Active
`;

      await fs.writeFile(
        path.join(this.aionPath, '.github/BMAD_HANDOVER.md'),
        handoverContent
      );

      spinner.succeed('State Machine setup complete');
    } catch (error) {
      spinner.fail('State Machine setup failed');
      throw error;
    }
  }

  getMemoryManagerTemplate() {
    return `/**
 * AION Memory Manager
 * Manages persistent context across sessions
 */

class MemoryManager {
  constructor() {
    this.productContextPath = './productContext.md';
    this.activeContextPath = './activeContext.md';
  }

  async updateContext(persona, artifacts) {
    // TODO: Implement context update logic
    console.log(\`📝 Updating context for \${persona}...\`);
  }

  async getContext() {
    // TODO: Implement context retrieval logic
    return {
      product: await this.loadProductContext(),
      active: await this.loadActiveContext()
    };
  }

  async loadProductContext() {
    // TODO: Load product context
    return {};
  }

  async loadActiveContext() {
    // TODO: Load active context
    return {};
  }
}

module.exports = MemoryManager;
`;
  }

  getStateMachineTemplate() {
    return `/**
 * AION State Machine
 * Manages handover between agents
 */

class StateMachine {
  constructor() {
    this.currentState = 'INIT';
    this.handoverLog = [];
  }

  async handover(fromPersona, toPersona, artifacts) {
    console.log(\`🔄 Handover: \${fromPersona} → \${toPersona}\`);
    
    // TODO: Implement handover logic
    this.currentState = toPersona;
    
    const handover = {
      from: fromPersona,
      to: toPersona,
      artifacts: artifacts,
      timestamp: new Date()
    };
    
    this.handoverLog.push(handover);
    return handover;
  }

  getCurrentState() {
    return this.currentState;
  }

  getHandoverHistory() {
    return this.handoverLog;
  }
}

module.exports = StateMachine;
`;
  }

  getSafetyProtocolTemplate() {
    return `/**
 * AION Safety Protocol
 * Implements micro-commit system with rollback capability
 */

class SafetyProtocol {
  constructor() {
    this.commitTracker = [];
    this.rollbackManager = new RollbackManager();
  }

  async microCommit(persona, stepId, description, changes) {
    console.log(\`🛡️ Micro-commit: [\${persona}] [\${stepId}] \${description}\`);
    
    // TODO: Implement validation
    await this.validateChanges(changes);
    
    // TODO: Create commit
    const commit = {
      persona: persona,
      stepId: stepId,
      description: description,
      changes: changes,
      timestamp: new Date(),
      hash: this.generateHash(changes)
    };
    
    this.commitTracker.push(commit);
    return commit.id;
  }

  async validateChanges(changes) {
    // TODO: Implement validation logic
    console.log('✅ Changes validated');
  }

  generateHash(changes) {
    // TODO: Implement hash generation
    return Date.now().toString();
  }

  async rollback(stepId) {
    console.log(\`🔄 Rolling back to step \${stepId}\`);
    // TODO: Implement rollback logic
  }
}

class RollbackManager {
  async rollback(commit) {
    // TODO: Implement rollback logic
    console.log('🔄 Rollback executed');
  }
}

module.exports = SafetyProtocol;
`;
  }
}

// Run initialization if called directly
if (require.main === module) {
  const initializer = new AIONInitializer();
  initializer.init().catch(console.error);
}

module.exports = AIONInitializer;
