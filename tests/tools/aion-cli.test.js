const chalk = require('chalk');

/**
 * Generic list function for AION entities (agents, workflows, etc.)
 * Matches the listEntities logic in tools/cli/aion-cli.js
 */
const listEntities = (title, entities, logSpy = console.log) => {
  logSpy(chalk.blue(title));
  if (entities && typeof entities === 'object') {
    Object.values(entities).forEach(entity => {
      const name = typeof entity === 'object' ? entity.name : entity;
      logSpy(chalk.gray(`- ${name}`));
    });
  } else {
    logSpy(chalk.yellow('No items configured in package.json'));
  }
};

describe('aion-cli listEntities', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.fn();
  });

  test('lists agents correctly when provided an agents object', () => {
    const agents = {
      'github-pm': { name: 'GitHub PM (Product Manager)', path: 'src/modules/aion/agents/github-pm.js' },
      'github-architect': { name: 'GitHub Architect', path: 'src/modules/aion/agents/github-architect.js' }
    };

    listEntities('🤖 Available AION agents:', agents, logSpy);

    expect(logSpy).toHaveBeenCalledWith(chalk.blue('🤖 Available AION agents:'));
    expect(logSpy).toHaveBeenCalledWith(chalk.gray('- GitHub PM (Product Manager)'));
    expect(logSpy).toHaveBeenCalledWith(chalk.gray('- GitHub Architect'));
  });

  test('lists workflows correctly when provided simple or object workflow structures', () => {
    const workflows = {
      'github-full-cycle': { name: 'GitHub Full Cycle' },
      'simple-workflow': 'Simple Workflow'
    };

    listEntities('📋 Available AION workflows:', workflows, logSpy);

    expect(logSpy).toHaveBeenCalledWith(chalk.blue('📋 Available AION workflows:'));
    expect(logSpy).toHaveBeenCalledWith(chalk.gray('- GitHub Full Cycle'));
    expect(logSpy).toHaveBeenCalledWith(chalk.gray('- Simple Workflow'));
  });

  test('prints warning message when entities are missing or undefined', () => {
    listEntities('🤖 Available AION agents:', undefined, logSpy);

    expect(logSpy).toHaveBeenCalledWith(chalk.blue('🤖 Available AION agents:'));
    expect(logSpy).toHaveBeenCalledWith(chalk.yellow('No items configured in package.json'));
  });
});
