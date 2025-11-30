#!/usr/bin/env node

/**
 * AION State Reset Tool
 * Resets the state machine and clears history
 */

const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const StateMachine = require('../../src/modules/aion/state/state-machine');

class StateResetTool {
  constructor() {
    this.projectRoot = process.cwd();
    this.stateMachine = new StateMachine(this.projectRoot);
  }

  async reset() {
    console.log(
      chalk.cyan(
        chalk.bold('🔄 AION State Reset')
      )
    );
    console.log(chalk.gray('This will reset the state machine and clear handover history\n'));

    try {
      // Confirm reset
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to reset the state machine? This will clear all handover history.',
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('❌ State reset cancelled.'));
        return;
      }

      // Additional confirmation for safety
      const { doubleConfirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'doubleConfirm',
          message: 'This is a destructive operation. Type "yes" to confirm:',
          default: false
        }
      ]);

      if (!doubleConfirm) {
        console.log(chalk.yellow('❌ State reset cancelled.'));
        return;
      }

      // Perform reset
      await this.performReset();

    } catch (error) {
      console.error(chalk.red('\n❌ State reset failed:'), error.message);
      process.exit(1);
    }
  }

  async performReset() {
    console.log(chalk.blue('🔄 Resetting state machine...'));

    try {
      // Initialize state machine
      await this.stateMachine.initialize();

      // Get current statistics before reset
      const statsBefore = this.stateMachine.getStatistics();

      // Reset state machine
      await this.stateMachine.reset();

      // Display reset summary
      this.displayResetSummary(statsBefore);

      console.log(chalk.green('\n✅ State machine reset complete!'));
      console.log(chalk.cyan('\n📖 Next steps:'));
      console.log(chalk.gray('1. Run: npm run aion:agents:list'));
      console.log(chalk.gray('2. Activate an agent to begin new workflow'));
      console.log(chalk.gray('3. Check status: npm run aion:memory:status'));

    } catch (error) {
      console.error(chalk.red('❌ Reset operation failed:'), error.message);
      throw error;
    }
  }

  displayResetSummary(statsBefore) {
    console.log(chalk.blue('\n📊 Reset Summary:'));
    console.log(chalk.yellow('\nBefore Reset:'));
    console.log(`  Total Handovers: ${statsBefore.totalHandovers}`);
    console.log(`  Current State: ${statsBefore.currentState}`);
    
    if (Object.keys(statsBefore.personaTransitions).length > 0) {
      console.log(chalk.yellow('\nCleared Transitions:'));
      Object.entries(statsBefore.personaTransitions).forEach(([transition, count]) => {
        console.log(`  ${transition}: ${count} times`);
      });
    }

    console.log(chalk.yellow('\nAfter Reset:'));
    console.log(`  Total Handovers: 0`);
    console.log(`  Current State: INIT`);
    console.log(`  History: Cleared`);
  }
}

// Run if called directly
if (require.main === module) {
  const tool = new StateResetTool();
  tool.reset().catch(console.error);
}

module.exports = StateResetTool;
