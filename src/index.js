#!/usr/bin/env node

/**
 * AION - AI Orchestration Native
 * Main entry point for AION autonomous development system
 */

const chalk = require('chalk');
const figlet = require('figlet');
const boxen = require('boxen');

console.log(
  chalk.cyan(
    figlet.textSync('AION', { horizontalLayout: 'full' })
  )
);

console.log(
  boxen(
    chalk.green('AI Orchestration Native') + '\n' +
    chalk.yellow('Autonomous AI-driven development lifecycle') + '\n' +
    chalk.blue('Combining BMAD Method robustness with GitHub-native orchestration'),
    { padding: 1, margin: 1, borderStyle: 'round' }
  )
);

console.log(chalk.gray('\n🚀 AION v1.0.0-alpha.1 - AI Orchestration Native Ready!'));
console.log(chalk.gray('📖 Documentation: ./docs/'));
console.log(chalk.gray('🔧 Get started: npm run aion:init'));

module.exports = {
  name: 'AION',
  version: '1.0.0-alpha.1',
  description: 'AI Orchestration Native - Autonomous AI-driven development lifecycle'
};
