#!/usr/bin/env node

/**
 * AION CLI - Command Line Interface for AI Orchestration Native
 */

const { program } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const AIONInitializer = require('../aion/aion-init');

// Display welcome banner
console.log(
  chalk.cyan(
    figlet.textSync('AION', { horizontalLayout: 'full' })
  )
);

console.log(chalk.green('AI Orchestration Native CLI'));
console.log(chalk.gray('Autonomous AI-driven development lifecycle\n'));

// Set up CLI program
program
  .name('aion')
  .description('AI Orchestration Native - Autonomous AI-driven development lifecycle')
  .version('1.0.0-alpha.1');

// Available commands
program
  .command('init')
  .description('Initialize AION project')
  .action(async () => {
    const initializer = new AIONInitializer();
    await initializer.init();
  });

program
  .command('workflow:github-full-cycle')
  .description('Run complete GitHub native development cycle')
  .action(() => {
    console.log(chalk.blue('🔄 Starting GitHub full cycle workflow...'));
    // TODO: Implement workflow logic
  });

program
  .command('memory:status')
  .description('Show Memory Bank status')
  .action(() => {
    console.log(chalk.blue('🧠 Checking Memory Bank status...'));
    // TODO: Implement memory status logic
  });

program
  .command('state:reset')
  .description('Reset state machine')
  .action(() => {
    console.log(chalk.blue('🔄 Resetting state machine...'));
    // TODO: Implement state reset logic
  });

program
  .command('agents:list')
  .description('List available AION agents')
  .action(() => {
    console.log(chalk.blue('🤖 Available AION agents:'));
    console.log(chalk.gray('- GitHub PM (Product Manager)'));
    console.log(chalk.gray('- GitHub Architect'));
    console.log(chalk.gray('- GitHub Developer'));
    console.log(chalk.gray('- GitHub QA'));
    // TODO: Implement agent listing logic
  });

program
  .command('workflows:list')
  .description('List available AION workflows')
  .action(() => {
    console.log(chalk.blue('📋 Available AION workflows:'));
    console.log(chalk.gray('- GitHub Full Cycle'));
    console.log(chalk.gray('- Memory Status Check'));
    console.log(chalk.gray('- State Reset'));
    // TODO: Implement workflow listing logic
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (process.argv.slice(2).length === 0) {
  program.outputHelp();
}
