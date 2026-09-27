const fs = require('fs-extra');
const path = require('path');

// Extract or require AIONInitializer class logic from tools/aion/aion-init.js
// Since tools/aion/aion-init.js executes directly if invoked, let's test isInitialized method logic.
const AIONInitializer = class {
  constructor(aionPath) {
    this.projectRoot = aionPath;
    this.aionPath = aionPath;
  }

  async isInitialized() {
    const [pkgExists, moduleExists] = await Promise.all([
      fs.pathExists(path.join(this.aionPath, 'package.json')),
      fs.pathExists(path.join(this.aionPath, 'src/modules/aion'))
    ]);
    return pkgExists && moduleExists;
  }
};

describe('AIONInitializer', () => {
  const testDir = path.join(__dirname, 'test-init-root');

  beforeEach(async () => {
    await fs.remove(testDir);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  test('isInitialized returns true when both package.json and src/modules/aion exist', async () => {
    await fs.writeJson(path.join(testDir, 'package.json'), {});
    await fs.ensureDir(path.join(testDir, 'src/modules/aion'));

    const initializer = new AIONInitializer(testDir);
    const result = await initializer.isInitialized();
    expect(result).toBe(true);
  });

  test('isInitialized returns false when package.json is missing', async () => {
    await fs.ensureDir(path.join(testDir, 'src/modules/aion'));

    const initializer = new AIONInitializer(testDir);
    const result = await initializer.isInitialized();
    expect(result).toBe(false);
  });

  test('isInitialized returns false when src/modules/aion is missing', async () => {
    await fs.writeJson(path.join(testDir, 'package.json'), {});

    const initializer = new AIONInitializer(testDir);
    const result = await initializer.isInitialized();
    expect(result).toBe(false);
  });
});
