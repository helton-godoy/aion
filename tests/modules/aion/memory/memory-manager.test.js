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
    jest.restoreAllMocks();
  });

  describe('getStatus', () => {
    test('returns status when context files do not exist', async () => {
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

    test('returns correct file size and existence when files exist', async () => {
      const memoryManager = new MemoryManager(testRoot);

      await memoryManager.updateContext('developer', [{ name: 'test-artifact', type: 'CODE' }]);

      const status = await memoryManager.getStatus();

      expect(status.productContext.exists).toBe(false);
      expect(status.productContext.size).toBe(0);
      expect(status.activeContext.exists).toBe(true);
      expect(status.activeContext.size).toBeGreaterThan(0);
      expect(status.lastActivity).toBeNull();
    });
  });

  describe('getContext', () => {
    test('loads default contexts when context files do not exist', async () => {
      const memoryManager = new MemoryManager(testRoot);
      const context = await memoryManager.getContext();

      expect(context.product.metadata.project).toBe('AION');
      expect(context.active.session.phase).toBe('Initialization');
      expect(context.combined.metadata.project).toBe('AION');
    });

    test('handles failure gracefully in getContext if load throws uncaught error', async () => {
      const memoryManager = new MemoryManager(testRoot);
      jest.spyOn(memoryManager, 'loadProductContext').mockRejectedValue(new Error('Fatal error'));

      const context = await memoryManager.getContext();
      expect(context).toEqual({ product: {}, active: {}, combined: {} });
    });
  });

  describe('loadProductContext and loadActiveContext', () => {
    test('loadProductContext parses productContext.md if present', async () => {
      const memoryManager = new MemoryManager(testRoot);
      const productContent = '# Product Overview\n\n**Version**: 2.0.0\n';
      await fs.writeFile(memoryManager.productContextPath, productContent, 'utf8');

      const productContext = await memoryManager.loadProductContext();
      expect(productContext.metadata.version).toBe('2.0.0');
      expect(productContext.sections['Product Overview']).toEqual([]);
    });

    test('loadProductContext handles non-ENOENT error gracefully', async () => {
      const memoryManager = new MemoryManager(testRoot);
      jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('Disk read error'));

      const productContext = await memoryManager.loadProductContext();
      expect(productContext.metadata.project).toBe('AION');
    });

    test('loadActiveContext handles non-ENOENT error gracefully', async () => {
      const memoryManager = new MemoryManager(testRoot);
      jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('Disk read error'));

      const activeContext = await memoryManager.loadActiveContext();
      expect(activeContext.session.phase).toBe('Initialization');
    });
  });

  describe('updateContext', () => {
    test('updates active context with non-significant artifacts without updating product context', async () => {
      const memoryManager = new MemoryManager(testRoot);
      const artifacts = [{ name: 'task', type: 'TASK' }];

      await memoryManager.updateContext('architect', artifacts);

      const activeExists = await fs.pathExists(memoryManager.activeContextPath);
      const productExists = await fs.pathExists(memoryManager.productContextPath);

      expect(activeExists).toBe(true);
      expect(productExists).toBe(false);
    });

    test('merges into product context when update contains significant artifacts', async () => {
      const memoryManager = new MemoryManager(testRoot);
      const artifacts = [{ name: 'spec', type: 'TECH_SPEC' }];

      await memoryManager.updateContext('architect', artifacts);

      const productExists = await fs.pathExists(memoryManager.productContextPath);
      expect(productExists).toBe(true);

      const status = await memoryManager.getStatus();
      expect(status.productContext.exists).toBe(true);
    });

    test('throws error if context update fails during save', async () => {
      const memoryManager = new MemoryManager(testRoot);
      jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Write failure'));

      await expect(
        memoryManager.updateContext('developer', [{ name: 'test', type: 'CODE' }])
      ).rejects.toThrow('Write failure');
    });
  });

  describe('isSignificantUpdate', () => {
    test('identifies PRD, TECH_SPEC, IMPLEMENTATION, and RELEASE as significant', () => {
      const memoryManager = new MemoryManager(testRoot);

      expect(memoryManager.isSignificantUpdate([{ type: 'PRD_DRAFT' }])).toBe(true);
      expect(memoryManager.isSignificantUpdate([{ type: 'TECH_SPEC' }])).toBe(true);
      expect(memoryManager.isSignificantUpdate([{ type: 'FULL_IMPLEMENTATION' }])).toBe(true);
      expect(memoryManager.isSignificantUpdate([{ type: 'RELEASE_NOTES' }])).toBe(true);
      expect(memoryManager.isSignificantUpdate([{ type: 'DOCS' }])).toBe(false);
      expect(memoryManager.isSignificantUpdate([])).toBe(false);
    });
  });

  describe('parseMarkdownContent and formatContextAsMarkdown', () => {
    test('formats active context markdown correctly', () => {
      const memoryManager = new MemoryManager(testRoot);
      const context = {
        session: {
          startedAt: '2025-01-01T00:00:00.000Z',
          phase: 'Development',
          activePersona: 'developer',
          currentState: 'Writing tests'
        },
        personas: {
          developer: {
            lastUpdated: '2025-01-01T00:00:00.000Z',
            status: 'active',
            artifacts: [
              { type: 'CODE', description: 'Added tests' },
              { description: 'No type artifact' }
            ]
          }
        }
      };

      const markdown = memoryManager.formatContextAsMarkdown(context);
      expect(markdown).toContain('# Active Context - AION');
      expect(markdown).toContain('**Session Started:** 2025-01-01T00:00:00.000Z');
      expect(markdown).toContain('### developer');
      expect(markdown).toContain('- CODE: Added tests');
      expect(markdown).toContain('- Unknown: No type artifact');
    });

    test('parses markdown content with headers and metadata', () => {
      const memoryManager = new MemoryManager(testRoot);
      const markdown = '# Section Title\n\n**Session Started**: 2025-01-01\nLine 1\n';

      const parsed = memoryManager.parseMarkdownContent(markdown);
      expect(parsed.metadata.session_started).toBe('2025-01-01');
      expect(parsed.sections['Section Title']).toEqual(['Line 1']);
    });
  });

  describe('mergeContexts', () => {
    test('combines personas and artifacts from product and active contexts', () => {
      const memoryManager = new MemoryManager(testRoot);
      const product = {
        personas: { pm: { status: 'idle' } },
        artifacts: [{ id: 1 }]
      };
      const active = {
        personas: { dev: { status: 'active' } },
        artifacts: [{ id: 2 }]
      };

      const combined = memoryManager.mergeContexts(product, active);
      expect(combined.personas).toEqual({
        pm: { status: 'idle' },
        dev: { status: 'active' }
      });
      expect(combined.artifacts).toEqual([{ id: 1 }, { id: 2 }]);
    });
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
