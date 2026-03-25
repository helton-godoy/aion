const fs = require('fs-extra');
const path = require('path');
const SafetyProtocol = require('../../../../src/modules/aion/safety/safety-protocol');

jest.mock('fs-extra');

describe('SafetyProtocol Core', () => {
  let safetyProtocol;
  const projectRoot = '/test/root';

  beforeEach(() => {
    jest.clearAllMocks();
    safetyProtocol = new SafetyProtocol(projectRoot);
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(safetyProtocol.projectRoot).toBe(projectRoot);
      expect(safetyProtocol.commitTracker).toEqual([]);
      expect(safetyProtocol.rollbackManager).toBeDefined();
      expect(safetyProtocol.validationGates).toBeDefined();
    });

    it('should use process.cwd() as default projectRoot', () => {
      const defaultProtocol = new SafetyProtocol();
      expect(defaultProtocol.projectRoot).toBe(process.cwd());
    });
  });

  describe('microCommit', () => {
    const persona = 'DEVELOPER';
    const stepId = 'STEP-001';
    const description = 'Test commit';
    const changes = { files: [{ path: 'test.js', action: 'create', content: 'test' }] };

    it('should successfully execute a micro-commit', async () => {
      // Mock validation success (default)
      // Mock rollback point creation
      jest.spyOn(safetyProtocol.rollbackManager, 'createPoint').mockResolvedValue('rollback-123');
      // Mock saveCommitTracker
      jest.spyOn(safetyProtocol, 'saveCommitTracker').mockResolvedValue();
      // Mock executeChanges
      jest.spyOn(safetyProtocol, 'executeChanges').mockResolvedValue();

      const commit = await safetyProtocol.microCommit(persona, stepId, description, changes);

      expect(commit).toBeDefined();
      expect(commit.persona).toBe(persona);
      expect(commit.stepId).toBe(stepId);
      expect(commit.description).toBe(description);
      expect(commit.status).toBe('committed');
      expect(commit.rollbackPoint).toBe('rollback-123');
      expect(safetyProtocol.commitTracker).toHaveLength(1);
      expect(safetyProtocol.saveCommitTracker).toHaveBeenCalled();
      expect(safetyProtocol.executeChanges).toHaveBeenCalledWith(changes);
    });

    it('should fail and throw error when validation fails', async () => {
      const error = new Error('Validation failed');
      jest.spyOn(safetyProtocol.validationGates, 'validate').mockRejectedValue(error);

      await expect(safetyProtocol.microCommit(persona, stepId, description, changes))
        .rejects.toThrow('Validation failed');

      expect(safetyProtocol.commitTracker).toHaveLength(0);
    });
  });

  describe('rollback', () => {
    it('should successfully rollback to a valid commit', async () => {
      const commit = {
        id: 'test-id',
        status: 'committed',
        rollbackPoint: 'rollback-123'
      };
      safetyProtocol.commitTracker = [commit];

      jest.spyOn(safetyProtocol.rollbackManager, 'rollback').mockResolvedValue({ restored: true });
      jest.spyOn(safetyProtocol, 'saveCommitTracker').mockResolvedValue();

      const result = await safetyProtocol.rollback('test-id');

      expect(result).toEqual({ restored: true });
      expect(commit.status).toBe('rolled_back');
      expect(commit.rollbackTimestamp).toBeDefined();
      expect(safetyProtocol.saveCommitTracker).toHaveBeenCalled();
    });

    it('should throw error when commit ID is not found', async () => {
      await expect(safetyProtocol.rollback('non-existent'))
        .rejects.toThrow('Commit non-existent not found');
    });
  });
});

describe('SafetyProtocol State Management & Utilities', () => {
  let safetyProtocol;
  const projectRoot = '/test/root';

  beforeEach(() => {
    jest.clearAllMocks();
    safetyProtocol = new SafetyProtocol(projectRoot);
  });

  describe('findCommit', () => {
    it('should find a commit by ID', () => {
      const commit = { id: 'test-id' };
      safetyProtocol.commitTracker = [commit];
      expect(safetyProtocol.findCommit('test-id')).toBe(commit);
    });

    it('should return undefined if commit is not found', () => {
      expect(safetyProtocol.findCommit('none')).toBeUndefined();
    });
  });

  describe('getCommitHistory', () => {
    it('should return commit history within limit', () => {
      safetyProtocol.commitTracker = Array(30).fill(0).map((_, i) => ({ id: i.toString() }));
      const history = safetyProtocol.getCommitHistory(10);
      expect(history).toHaveLength(10);
      expect(history[0].id).toBe('20');
      expect(history[9].id).toBe('29');
    });

    it('should default to limit 20', () => {
      safetyProtocol.commitTracker = Array(30).fill(0).map((_, i) => ({ id: i.toString() }));
      expect(safetyProtocol.getCommitHistory()).toHaveLength(20);
    });
  });

  describe('getCommitsByPersona', () => {
    it('should filter commits by persona', () => {
      safetyProtocol.commitTracker = [
        { id: '1', persona: 'A' },
        { id: '2', persona: 'B' },
        { id: '3', persona: 'A' }
      ];
      const commits = safetyProtocol.getCommitsByPersona('A');
      expect(commits).toHaveLength(2);
      expect(commits[0].id).toBe('1');
      expect(commits[1].id).toBe('3');
    });
  });

  describe('generateCommitId', () => {
    it('should generate a commit ID with persona, stepId and timestamp', () => {
      const id = safetyProtocol.generateCommitId('PM', 'STEP-1');
      expect(id).toMatch(/^PM-STEP-1-\d+$/);
    });
  });

  describe('generateHash', () => {
    it('should generate a consistent hash for changes', () => {
      const changes = { a: 1, b: 2 };
      const hash1 = safetyProtocol.generateHash(changes);
      const hash2 = safetyProtocol.generateHash({ b: 2, a: 1 });
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(8);
    });
  });

  describe('saveCommitTracker', () => {
    it('should save commit tracker to JSON file', async () => {
      safetyProtocol.commitTracker = [{ id: '1' }];
      await safetyProtocol.saveCommitTracker();

      const expectedPath = path.join(projectRoot, '.aion', 'commit-tracker.json');
      expect(fs.ensureDir).toHaveBeenCalled();
      expect(fs.writeJSON).toHaveBeenCalledWith(expectedPath, safetyProtocol.commitTracker, { spaces: 2 });
    });
  });

  describe('loadCommitTracker', () => {
    it('should load commit tracker if file exists', async () => {
      const trackerData = [{ id: '1' }];
      fs.pathExists.mockResolvedValue(true);
      fs.readJSON.mockResolvedValue(trackerData);

      await safetyProtocol.loadCommitTracker();

      expect(safetyProtocol.commitTracker).toEqual(trackerData);
    });

    it('should initialize empty if file does not exist', async () => {
      fs.pathExists.mockResolvedValue(false);
      await safetyProtocol.loadCommitTracker();
      expect(safetyProtocol.commitTracker).toEqual([]);
    });

    it('should handle load error gracefully', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readJSON.mockRejectedValue(new Error('Load error'));

      await safetyProtocol.loadCommitTracker();
      expect(safetyProtocol.commitTracker).toEqual([]);
    });
  });

  describe('getStatistics', () => {
    it('should calculate statistics correctly', () => {
      safetyProtocol.commitTracker = [
        { persona: 'PM', status: 'committed' },
        { persona: 'PM', status: 'rolled_back' },
        { persona: 'DEV', status: 'committed' }
      ];

      const stats = safetyProtocol.getStatistics();
      expect(stats.totalCommits).toBe(3);
      expect(stats.commitsByPersona['PM']).toBe(2);
      expect(stats.commitsByPersona['DEV']).toBe(1);
      expect(stats.commitsByStatus['committed']).toBe(2);
      expect(stats.commitsByStatus['rolled_back']).toBe(1);
      expect(stats.rollbackRate).toBeCloseTo(33.33);
    });

    it('should handle zero commits in statistics', () => {
      const stats = safetyProtocol.getStatistics();
      expect(stats.totalCommits).toBe(0);
      expect(stats.rollbackRate).toBe(0);
    });
  });
});

describe('SafetyProtocol Change Execution & Helper Classes', () => {
  let safetyProtocol;
  const projectRoot = '/test/root';

  beforeEach(() => {
    jest.clearAllMocks();
    safetyProtocol = new SafetyProtocol(projectRoot);
  });

  describe('executeChanges', () => {
    it('should call executeFileChange and executeApiCall', async () => {
      const changes = {
        files: [{ path: 'f1' }],
        api: [{ method: 'GET' }]
      };

      const fileSpy = jest.spyOn(safetyProtocol, 'executeFileChange').mockResolvedValue();
      const apiSpy = jest.spyOn(safetyProtocol, 'executeApiCall').mockResolvedValue();

      await safetyProtocol.executeChanges(changes);

      expect(fileSpy).toHaveBeenCalledWith(changes.files[0]);
      expect(apiSpy).toHaveBeenCalledWith(changes.api[0]);
    });
  });

  describe('executeFileChange', () => {
    it('should handle create action', async () => {
      const change = { action: 'create', path: 'new.js', content: 'data' };
      await safetyProtocol.executeFileChange(change);
      expect(fs.ensureDir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(path.join(projectRoot, 'new.js'), 'data', 'utf8');
    });

    it('should handle update action', async () => {
      const change = { action: 'update', path: 'upd.js', content: 'new data' };
      await safetyProtocol.executeFileChange(change);
      expect(fs.writeFile).toHaveBeenCalledWith(path.join(projectRoot, 'upd.js'), 'new data', 'utf8');
    });

    it('should handle delete action', async () => {
      const change = { action: 'delete', path: 'del.js' };
      await safetyProtocol.executeFileChange(change);
      expect(fs.remove).toHaveBeenCalledWith(path.join(projectRoot, 'del.js'));
    });

    it('should throw error for unknown action', async () => {
      const change = { action: 'unknown', path: '?' };
      await expect(safetyProtocol.executeFileChange(change)).rejects.toThrow('Unknown file action: unknown');
    });
  });

  describe('RollbackManager', () => {
    it('should create a rollback point', async () => {
      const changes = { files: [] };
      fs.pathExists.mockResolvedValue(false); // for captureCurrentState

      const pointId = await safetyProtocol.rollbackManager.createPoint(changes);

      expect(pointId).toMatch(/^rollback-/);
      expect(fs.ensureDir).toHaveBeenCalled();
      expect(fs.writeJSON).toHaveBeenCalled();
    });

    it('should capture current state during createPoint', async () => {
      const changes = { files: [{ path: 'existing.js' }] };
      fs.pathExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue('old content');
      fs.stat.mockResolvedValue({ size: 100 });

      const pointId = await safetyProtocol.rollbackManager.createPoint(changes);

      const callArgs = fs.writeJSON.mock.calls[0];
      const savedPoint = callArgs[1];
      expect(savedPoint.state.files['existing.js']).toEqual({
        exists: true,
        content: 'old content',
        stats: { size: 100 }
      });
    });

    it('should rollback by restoring state', async () => {
      const commit = { rollbackPoint: 'rb-1' };
      const rbPoint = {
        state: {
          files: {
            'file1.js': { exists: true, content: 'restored' },
            'file2.js': { exists: false }
          }
        }
      };

      fs.pathExists.mockResolvedValue(true);
      fs.readJSON.mockResolvedValue(rbPoint);

      await safetyProtocol.rollbackManager.rollback(commit);

      expect(fs.writeFile).toHaveBeenCalledWith(expect.stringContaining('file1.js'), 'restored', 'utf8');
      expect(fs.remove).toHaveBeenCalledWith(expect.stringContaining('file2.js'));
    });
  });

  describe('Validators', () => {
    it('FileValidator should detect path traversal', async () => {
      const changes = { files: [{ path: '../../etc/passwd' }] };
      const validator = safetyProtocol.validationGates.validators.find(v => v.constructor.name === 'FileValidator');
      await expect(validator.validate(changes)).rejects.toThrow('Path traversal detected');
    });

    it('FileValidator should verify content is string', async () => {
      const changes = { files: [{ path: 'test.js', content: 123 }] };
      const validator = safetyProtocol.validationGates.validators.find(v => v.constructor.name === 'FileValidator');
      await expect(validator.validate(changes)).rejects.toThrow('File content must be a string');
    });

    it('ContentValidator and SecurityValidator should not throw (placeholders)', async () => {
      const changes = {};
      await expect(safetyProtocol.validationGates.validate(changes)).resolves.not.toThrow();
    });
  });
});
