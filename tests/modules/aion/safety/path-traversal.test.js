const SafetyProtocol = require('../../../../src/modules/aion/safety/safety-protocol');
const path = require('path');

describe('Path Traversal Security Test', () => {
  let protocol;
  let projectRoot;

  beforeAll(() => {
    projectRoot = path.resolve(__dirname, 'test-root');
    protocol = new SafetyProtocol(projectRoot);
  });

  const testCases = [
    {
      name: 'Legitimate path',
      path: 'src/index.js',
      expected: 'pass'
    },
    {
      name: 'Simple traversal',
      path: '../outside.js',
      expected: 'fail'
    },
    {
      name: 'Traversal within root (False Positive)',
      path: 'src/../index.js',
      expected: 'pass'
    },
    {
      name: 'Absolute path (Bypass)',
      path: '/etc/passwd',
      expected: 'fail'
    },
    {
      name: 'Encoded traversal (if applicable)',
      path: 'src/%2e%2e/index.js',
      expected: 'pass'
    }
  ];

  testCases.forEach(tc => {
    it(`should handle ${tc.name} correctly`, async () => {
      if (tc.expected === 'pass') {
        await expect(protocol.validationGates.validate({
          files: [{ path: tc.path, action: 'update', content: 'test' }]
        })).resolves.not.toThrow();
      } else {
        await expect(protocol.validationGates.validate({
          files: [{ path: tc.path, action: 'update', content: 'test' }]
        })).rejects.toThrow();
      }
    });
  });
});
