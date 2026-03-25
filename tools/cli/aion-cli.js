#!/usr/bin/env node

/**
 * AION CLI - Command Line Interface for AI Orchestration Native
 */

const { program } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const pkg = require('../../package.json');

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
  .action(() => {
    console.log(chalk.blue('🚀 Initializing AION project...'));
    console.log(chalk.gray('This will setup BMAD foundation and AION modules'));
    // TODO: Implement initialization logic
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

/**
 * Generic list function for AION entities (agents, workflows, etc.)
 * @param {string} title - The title to display
 * @param {Object} entities - The entities object from package.json
 */
const listEntities = (title, entities) => {
  console.log(chalk.blue(title));
  if (entities && typeof entities === 'object') {
    Object.values(entities).forEach(entity => {
      const name = typeof entity === 'object' ? entity.name : entity;
      console.log(chalk.gray(`- ${name}`));
    });
  } else {
    console.log(chalk.yellow('No items configured in package.json'));
  }
};

program
  .command('agents:list')
  .description('List available AION agents')
  .action(() => {
    listEntities('🤖 Available AION agents:', pkg.aion?.agents);
  });

program
  .command('workflows:list')
  .description('List available AION workflows')
  .action(() => {
    listEntities('📋 Available AION workflows:', pkg.aion?.workflows);
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (process.argv.slice(2).length === 0) {
  program.outputHelp();
}
