const SafetyProtocol = require('../../../../src/modules/aion/safety/safety-protocol');
const path = require('path');

describe('Path Traversal Security Test', () => {
  let protocol;

  beforeEach(() => {
    const projectRoot = path.resolve(__dirname, 'test-root');
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
      const promise = protocol.validationGates.validate({
        files: [{ path: tc.path, action: 'update', content: 'test' }]
      });

      if (tc.expected === 'fail') {
        await expect(promise).rejects.toThrow('Path traversal detected');
      } else {
        await expect(promise).resolves.not.toThrow();
      }
    });
  });
});
