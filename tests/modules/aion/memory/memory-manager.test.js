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

  describe("isSignificantUpdate", () => {
    test("returns true when artifacts include significant deliverable types", () => {
      const memoryManager = new MemoryManager(testRoot);

      expect(memoryManager.isSignificantUpdate([{ type: "PRD" }])).toBe(true);
      expect(memoryManager.isSignificantUpdate([{ type: "TECH_SPEC_V1" }])).toBe(true);
      expect(memoryManager.isSignificantUpdate([{ type: "IMPLEMENTATION" }])).toBe(true);
      expect(memoryManager.isSignificantUpdate([{ type: "RELEASE_NOTES" }])).toBe(true);
      expect(memoryManager.isSignificantUpdate([{ type: "OTHER" }, { type: "PRD" }])).toBe(true);
    });

    test("returns false when artifacts array is empty", () => {
      const memoryManager = new MemoryManager(testRoot);
      expect(memoryManager.isSignificantUpdate([])).toBe(false);
    });

    test("returns false when artifacts contain non-significant types", () => {
      const memoryManager = new MemoryManager(testRoot);
      expect(memoryManager.isSignificantUpdate([{ type: "CODE" }, { type: "LOG" }])).toBe(false);
    });

    test("returns false when artifact objects are missing type property or type is non-matching", () => {
      const memoryManager = new MemoryManager(testRoot);
      expect(memoryManager.isSignificantUpdate([{ name: "no-type-artifact" }, { type: null }, { type: undefined }])).toBe(false);
    });
  });
});
