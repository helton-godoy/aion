#!/usr/bin/env node

/**
 * AION GitHub Full Cycle Workflow
 * Complete autonomous development cycle from planning to release
 */

require('dotenv').config();
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const MemoryManager = require('../../src/modules/aion/memory/memory-manager');
const StateMachine = require('../../src/modules/aion/state/state-machine');
const SafetyProtocol = require('../../src/modules/aion/safety/safety-protocol');

class GitHubFullCycleWorkflow {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.memoryManager = new MemoryManager(projectRoot);
    this.stateMachine = new StateMachine(projectRoot);
    this.safetyProtocol = new SafetyProtocol(projectRoot);
  }

  async execute() {
    console.log(
      chalk.cyan(
        chalk.bold('🚀 AION GitHub Full Cycle Workflow')
      )
    );
    console.log(chalk.gray('Autonomous development lifecycle from planning to release\n'));

    try {
      // Initialize components
      await this.initialize();

      // Execute complete workflow
      await this.executeWorkflow();

      console.log(chalk.green('\n✨ GitHub Full Cycle completed successfully!'));

    } catch (error) {
      console.error(chalk.red('\n❌ Workflow failed:'), error.message);
      
      // Attempt rollback if safety protocol is available
      if (this.lastCommitId) {
        console.log(chalk.blue('\n🔄 Attempting rollback...'));
        try {
          await this.safetyProtocol.rollback(this.lastCommitId);
          console.log(chalk.green('✅ Rollback completed'));
        } catch (rollbackError) {
          console.error(chalk.red('❌ Rollback failed:'), rollbackError.message);
        }
      }
      
      process.exit(1);
    }
  }

  async initialize() {
    const spinner = ora('Initializing AION components...').start();

    try {
      // Initialize all components
      await this.memoryManager.getContext();
      await this.stateMachine.initialize();
      await this.safetyProtocol.loadCommitTracker();
      
      spinner.succeed('AION components initialized');
    } catch (error) {
      spinner.fail('Component initialization failed');
      throw error;
    }
  }

  async executeWorkflow() {
    const workflowSteps = [
      { name: 'Planning', persona: 'PM', artifacts: ['PRD'] },
      { name: 'Architecture', persona: 'ARCHITECT', artifacts: ['TECH_SPEC'] },
      { name: 'Development', persona: 'DEVELOPER', artifacts: ['IMPLEMENTATION'] },
      { name: 'Testing', persona: 'QA', artifacts: ['TEST_RESULTS'] },
      { name: 'Release', persona: 'RELEASE', artifacts: ['RELEASE'] }
    ];

    let previousPersona = 'INIT';

    for (const step of workflowSteps) {
      await this.executeStep(step, previousPersona);
      previousPersona = step.persona;
    }
  }

  async executeStep(step, previousPersona) {
    const stepSpinner = ora(`Executing ${step.name} phase...`).start();

    try {
      // Simulate step execution
      const artifacts = await this.simulateStepExecution(step);
      
      // Update memory
      await this.memoryManager.updateContext(step.persona, artifacts);
      
      // Create safety commit
      const commit = await this.safetyProtocol.microCommit(
        step.persona,
        this.generateStepId(step.persona),
        `Execute ${step.name} phase`,
        {
          type: 'workflow_step',
          step: step.name,
          persona: step.persona,
          artifacts: artifacts
        }
      );
      
      this.lastCommitId = commit.id;
      
      // Handover to next state
      await this.stateMachine.handover(previousPersona, step.persona, artifacts);
      
      stepSpinner.succeed(`${step.name} phase completed`);
      
      // Display step results
      this.displayStepResults(step, artifacts);
      
    } catch (error) {
      stepSpinner.fail(`${step.name} phase failed`);
      throw error;
    }
  }

  async simulateStepExecution(step) {
    // Simulate different artifact types for each step
    const artifacts = [];

    switch (step.persona) {
      case 'PM':
        artifacts.push({
          type: 'PRD',
          description: 'Product Requirements Document',
          content: '# Product Requirements\n\n## Overview\nAutonomous AI development system...',
          metadata: {
            version: '1.0.0',
            priority: 'high',
            estimatedEffort: '2 weeks'
          }
        });
        break;

      case 'ARCHITECT':
        artifacts.push({
          type: 'TECH_SPEC',
          description: 'Technical Specification',
          content: '# Technical Specification\n\n## Architecture\nThree-layer architecture...',
          metadata: {
            framework: 'BMAD-METHOD',
            platform: 'GitHub Native',
            complexity: 'medium'
          }
        });
        break;

      case 'DEVELOPER':
        artifacts.push({
          type: 'IMPLEMENTATION',
          description: 'Code implementation',
          content: '// Autonomous implementation\nconst aion = new AION();',
          metadata: {
            language: 'JavaScript',
            lines: 150,
            tests: 'pending'
          }
        });
        break;

      case 'QA':
        artifacts.push({
          type: 'TEST_RESULTS',
          description: 'Quality assurance results',
          content: '## Test Results\n\nAll tests passed: 45/45',
          metadata: {
            passed: 45,
            failed: 0,
            coverage: '95%'
          }
        });
        break;

      case 'RELEASE':
        artifacts.push({
          type: 'RELEASE',
          description: 'Release deployment',
          content: '## Release Notes\n\nVersion 1.0.0 released',
          metadata: {
            version: '1.0.0',
            tag: 'v1.0.0',
            deployment: 'successful'
          }
        });
        break;
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return artifacts;
  }

  generateStepId(persona) {
    const stepNumbers = {
      'PM': '001',
      'ARCHITECT': '002',
      'DEVELOPER': '003',
      'QA': '004',
      'RELEASE': '005'
    };
    return `STEP-${stepNumbers[persona] || '999'}`;
  }

  displayStepResults(step, artifacts) {
    console.log(chalk.blue(`\n📋 ${step.name} Results:`));
    
    artifacts.forEach(artifact => {
      console.log(chalk.yellow(`  • ${artifact.type}: ${artifact.description}`));
      
      if (artifact.metadata) {
        Object.entries(artifact.metadata).forEach(([key, value]) => {
          console.log(chalk.gray(`    ${key}: ${value}`));
        });
      }
    });
  }

  async getWorkflowStatistics() {
    const memoryStatus = await this.memoryManager.getStatus();
    const stateStats = this.stateMachine.getStatistics();
    const safetyStats = this.safetyProtocol.getStatistics();

    return {
      memory: memoryStatus,
      state: stateStats,
      safety: safetyStats
    };
  }
}

// Run if called directly
if (require.main === module) {
  const workflow = new GitHubFullCycleWorkflow();
  workflow.execute().catch(console.error);
}

module.exports = GitHubFullCycleWorkflow;
