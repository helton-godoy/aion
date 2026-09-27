const fs = require('fs-extra');
const path = require('path');
const MemoryManager = require('../../../../src/modules/aion/memory/memory-manager');

describe('MemoryManager', () => {
  const testRoot = path.join(__dirname, 'test-root');

  beforeEach(async () => {
    await fs.ensureDir(testRoot);
  });

  afterEach(async () => {
    await fs.remove(testRoot);
  });

  test('getStatus returns status when context files do not exist', async () => {
    const memoryManager = new MemoryManager(testRoot);
    const status = await memoryManager.getStatus();

    expect(status.productContext).toEqual({
      exists: false,
      size: 0,
      artifacts: 0
    });
    expect(status.activeContext).toEqual({
      exists: false,
      size: 0,
      activePersonas: 0
    });
    expect(status.totalArtifacts).toBe(0);
    expect(status.lastActivity).toBeNull();
  });

  test('getStatus returns correct file size and existence when files exist', async () => {
    const memoryManager = new MemoryManager(testRoot);

    await memoryManager.updateContext('developer', [{ name: 'test-artifact', type: 'CODE' }]);

    const status = await memoryManager.getStatus();

    expect(status.productContext.exists).toBe(false);
    expect(status.productContext.size).toBe(0);
    expect(status.activeContext.exists).toBe(true);
    expect(status.activeContext.size).toBeGreaterThan(0);
    expect(status.activeContext.activePersonas).toBe(0);
    expect(status.lastActivity).toBeNull();
  });
});
