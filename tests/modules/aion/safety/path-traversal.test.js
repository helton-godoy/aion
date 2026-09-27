const SafetyProtocol = require('../../../../src/modules/aion/safety/safety-protocol');
const path = require('path');

async function reproduce() {
  // Use a simulated project root that is not the actual /app
  const projectRoot = path.resolve(__dirname, 'test-root');
  const protocol = new SafetyProtocol(projectRoot);

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
      expected: 'pass' // Should be pass or fail depending on how it's handled, but let's see
    }
  ];

  console.log('--- Starting Path Traversal Security Test ---');
  console.log(`Project Root: ${projectRoot}\n`);

  let failures = 0;

  for (const tc of testCases) {
    console.log(`Testing: ${tc.name}`);
    console.log(`Path: ${tc.path}`);
    try {
      await protocol.validationGates.validate({
        files: [{ path: tc.path, action: 'update', content: 'test' }]
      });
      console.log(`Result: ALLOWED`);
      if (tc.expected === 'fail') {
        console.error(`❌ VULNERABILITY: ${tc.name} was ALLOWED but should be BLOCKED!`);
        failures++;
      } else {
        console.log(`✅ Correctly allowed.`);
      }
    } catch (error) {
      console.log(`Result: BLOCKED (${error.message})`);
      if (tc.expected === 'pass') {
        console.warn(`⚠️  FALSE POSITIVE: ${tc.name} was BLOCKED but should be ALLOWED!`);
        failures++;
      } else {
        console.log(`✅ Correctly blocked.`);
      }
    }
    console.log('---');
  }

  if (failures > 0) {
    console.error(`❌ ${failures} test cases FAILED!`);
    process.exit(1);
  } else {
    console.log('✅ All path traversal tests passed successfully!');
  }
}

reproduce().catch(err => {
    console.error(err);
    process.exit(1);
});
