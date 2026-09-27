const { execSync } = require('child_process');
const path = require('path');

describe('AION CLI', () => {
  const cliPath = path.join(__dirname, '../../tools/cli/aion-cli.js');

  test('workflows:list lists available workflows', () => {
    const output = execSync(`node ${cliPath} workflows:list`).toString();
    expect(output).toContain('📋 Available AION workflows:');
    expect(output).toContain('GitHub Full Cycle');
    expect(output).toContain('Memory Status Check');
    expect(output).toContain('State Reset');
  });

  test('agents:list lists available agents', () => {
    const output = execSync(`node ${cliPath} agents:list`).toString();
    expect(output).toContain('🤖 Available AION agents:');
    expect(output).toContain('GitHub PM (Product Manager)');
    expect(output).toContain('GitHub Architect');
    expect(output).toContain('GitHub Developer');
    expect(output).toContain('GitHub QA');
  });
});
