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

describe('MemoryManager getStatus error handling', () => {
  const projectRoot = '/test/root';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should map ENOENT stat to exists:false', async () => {
    jest.spyOn(fs, 'readFile').mockResolvedValue('# Test\n');
    const enoent = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
    jest.spyOn(fs, 'stat').mockRejectedValue(enoent);

    const mm = new MemoryManager(projectRoot);
    const status = await mm.getStatus();

    expect(status.productContext.exists).toBe(false);
    expect(status.productContext.size).toBe(0);
    expect(status.activeContext.exists).toBe(false);
    expect(status.activeContext.size).toBe(0);
  });

  it('should propagate non-ENOENT stat errors instead of reporting exists:false', async () => {
    jest.spyOn(fs, 'readFile').mockResolvedValue('# Test\n');
    const eacces = Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });
    jest.spyOn(fs, 'stat').mockRejectedValue(eacces);

    const mm = new MemoryManager(projectRoot);
    await expect(mm.getStatus()).rejects.toThrow('EACCES');
  });
});
