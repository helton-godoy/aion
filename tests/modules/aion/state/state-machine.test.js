const fs = require('fs-extra');
const path = require('path');
const StateMachine = require('../../../../src/modules/aion/state/state-machine');

jest.mock('fs-extra');

describe('StateMachine Core', () => {
  let stateMachine;
  const projectRoot = '/test/root';

  beforeEach(() => {
    jest.clearAllMocks();
    stateMachine = new StateMachine(projectRoot);
  });

  describe('constructor', () => {
    it('should initialize with default properties', () => {
      expect(stateMachine.projectRoot).toBe(projectRoot);
      expect(stateMachine.handoverLogPath).toBe(path.join(projectRoot, '.github/BMAD_HANDOVER.md'));
      expect(stateMachine.currentState).toBe('INIT');
      expect(stateMachine.handoverLog).toEqual([]);
      expect(stateMachine.transitionRules).toBeDefined();
    });

    it('should use process.cwd() as default projectRoot when none is provided', () => {
      const defaultSm = new StateMachine();
      expect(defaultSm.projectRoot).toBe(process.cwd());
    });
  });

  describe('initialize', () => {
    it('should initialize successfully when loadHandoverLog succeeds', async () => {
      jest.spyOn(stateMachine, 'loadHandoverLog').mockResolvedValue();
      await expect(stateMachine.initialize()).resolves.not.toThrow();
      expect(stateMachine.loadHandoverLog).toHaveBeenCalled();
    });

    it('should catch loadHandoverLog error and create new handover log', async () => {
      jest.spyOn(stateMachine, 'loadHandoverLog').mockRejectedValue(new Error('File missing'));
      jest.spyOn(stateMachine, 'createHandoverLog').mockResolvedValue();

      await stateMachine.initialize();

      expect(stateMachine.loadHandoverLog).toHaveBeenCalled();
      expect(stateMachine.createHandoverLog).toHaveBeenCalled();
    });
  });

  describe('handover', () => {
    it('should perform a valid handover successfully', async () => {
      jest.spyOn(stateMachine, 'saveHandoverLog').mockResolvedValue();
      jest.spyOn(stateMachine, 'notifyPersona').mockResolvedValue();

      const artifacts = [{ type: 'Spec' }];
      const result = await stateMachine.handover('INIT', 'PM', artifacts);

      expect(result).toBeDefined();
      expect(result.from).toBe('INIT');
      expect(result.to).toBe('PM');
      expect(result.artifacts).toEqual(artifacts);
      expect(result.id).toMatch(/^HANDOVER-\d+-[a-z0-9]+$/);
      expect(stateMachine.currentState).toBe('PM');
      expect(stateMachine.handoverLog).toHaveLength(1);
      expect(stateMachine.saveHandoverLog).toHaveBeenCalled();
      expect(stateMachine.notifyPersona).toHaveBeenCalledWith('PM', artifacts);
    });

    it('should throw an error and not update state when transition is invalid', async () => {
      await expect(stateMachine.handover('INIT', 'DEVELOPER'))
        .rejects.toThrow('Invalid transition from INIT to DEVELOPER');

      expect(stateMachine.currentState).toBe('INIT');
      expect(stateMachine.handoverLog).toHaveLength(0);
    });
  });

  describe('getCurrentState and getHandoverHistory', () => {
    it('should return correct current state object', () => {
      stateMachine.currentState = 'PM';
      stateMachine.handoverLog = [{ from: 'INIT', to: 'PM' }];

      const currentStateInfo = stateMachine.getCurrentState();

      expect(currentStateInfo.state).toBe('PM');
      expect(currentStateInfo.handoverCount).toBe(1);
      expect(currentStateInfo.lastHandover).toEqual({ from: 'INIT', to: 'PM' });
      expect(currentStateInfo.timestamp).toBeInstanceOf(Date);
    });

    it('should return last N handover items from history', () => {
      stateMachine.handoverLog = Array.from({ length: 15 }, (_, i) => ({ id: i }));

      const history = stateMachine.getHandoverHistory(5);
      expect(history).toHaveLength(5);
      expect(history[0].id).toBe(10);
      expect(history[4].id).toBe(14);
    });
  });

  describe('getStateFlow', () => {
    it('should return mermaid state diagram string', () => {
      const flow = stateMachine.getStateFlow();
      expect(flow).toContain('stateDiagram-v2');
      expect(flow).toContain('[*] --> Initialization');
    });
  });

  describe('loadHandoverLog & parseHandoverLog', () => {
    it('should read and parse existing markdown handover log', async () => {
      const markdownContent = `# BMAD Handover Protocol - AION

## Handover History
| 2025-01-01 | INIT | PM | Spec | First step |
| 2025-01-02 | PM | ARCHITECT | Architecture | Second step |

## Active Context
- Goal: Test
`;
      fs.readFile.mockResolvedValue(markdownContent);

      await stateMachine.loadHandoverLog();

      expect(stateMachine.handoverLog).toHaveLength(2);
      expect(stateMachine.handoverLog[0]).toEqual({
        date: '2025-01-01',
        from: 'INIT',
        to: 'PM',
        artifacts: 'Spec',
        notes: 'First step'
      });
    });

    it('should ignore ENOENT error when file does not exist', async () => {
      const enoent = new Error('ENOENT');
      enoent.code = 'ENOENT';
      fs.readFile.mockRejectedValue(enoent);

      await expect(stateMachine.loadHandoverLog()).resolves.not.toThrow();
      expect(stateMachine.handoverLog).toEqual([]);
    });

    it('should rethrow non-ENOENT errors', async () => {
      const permissionError = new Error('EACCES');
      permissionError.code = 'EACCES';
      fs.readFile.mockRejectedValue(permissionError);

      await expect(stateMachine.loadHandoverLog()).rejects.toThrow('EACCES');
    });
  });

  describe('saveHandoverLog & formatHandoverLog', () => {
    it('should format markdown and write to file', async () => {
      stateMachine.currentState = 'PM';
      stateMachine.handoverLog = [
        {
          timestamp: new Date('2025-01-01T00:00:00Z'),
          from: 'INIT',
          to: 'PM',
          artifacts: [{ type: 'PRD' }],
          notes: 'Initial PRD'
        }
      ];

      await stateMachine.saveHandoverLog();

      expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(stateMachine.handoverLogPath));
      expect(fs.writeFile).toHaveBeenCalled();

      const writtenContent = fs.writeFile.mock.calls[0][1];
      expect(writtenContent).toContain('# BMAD Handover Protocol - AION');
      expect(writtenContent).toContain('| 2025-01-01 | INIT | PM | PRD | Initial PRD |');
    });

    it('should correctly format string artifacts or missing timestamp', async () => {
      stateMachine.handoverLog = [
        {
          timestamp: new Date('2025-01-01T00:00:00Z'),
          from: 'INIT',
          to: 'PM',
          artifacts: 'CustomArtifact'
        }
      ];

      await stateMachine.saveHandoverLog();
      const writtenContent = fs.writeFile.mock.calls[0][1];
      expect(writtenContent).toContain('| 2025-01-01 | INIT | PM | CustomArtifact |  |');
    });

    it('should handle missing timestamp when formatting log line', async () => {
      stateMachine.handoverLog = [
        {
          from: 'PM',
          to: 'ARCHITECT',
          artifacts: 'Spec'
        },
        {
          from: 'INIT',
          to: 'PM',
          artifacts: 'CustomArtifact',
          timestamp: new Date('2025-01-01T00:00:00Z')
        }
      ];

      await stateMachine.saveHandoverLog();
      const writtenContent = fs.writeFile.mock.calls[0][1];
      expect(writtenContent).toContain('| Unknown | PM | ARCHITECT | Spec |  |');
    });
  });

  describe('reset', () => {
    it('should reset state machine properties and save empty handover log', async () => {
      stateMachine.currentState = 'DEVELOPER';
      stateMachine.handoverLog = [{ from: 'PM', to: 'ARCHITECT' }];
      jest.spyOn(stateMachine, 'saveHandoverLog').mockResolvedValue();

      await stateMachine.reset();

      expect(stateMachine.currentState).toBe('INIT');
      expect(stateMachine.handoverLog).toEqual([]);
      expect(stateMachine.saveHandoverLog).toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should calculate transition and artifact statistics correctly', () => {
      stateMachine.currentState = 'DEVELOPER';
      stateMachine.handoverLog = [
        { from: 'INIT', to: 'PM', artifacts: [{ type: 'PRD' }] },
        { from: 'PM', to: 'ARCHITECT', artifacts: [{ type: 'PRD' }, { type: 'Spec' }] },
        { from: 'INIT', to: 'PM', artifacts: 'InvalidFormat' }
      ];

      const stats = stateMachine.getStatistics();

      expect(stats.totalHandovers).toBe(3);
      expect(stats.currentState).toBe('DEVELOPER');
      expect(stats.personaTransitions['INIT → PM']).toBe(2);
      expect(stats.personaTransitions['PM → ARCHITECT']).toBe(1);
      expect(stats.artifactTypes['PRD']).toBe(2);
      expect(stats.artifactTypes['Spec']).toBe(1);
    });
  });

  describe('notifyPersona', () => {
    it('should log notification message to console', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await stateMachine.notifyPersona('PM', [{ type: 'Spec' }]);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Notifying PM of new artifacts'));
      consoleSpy.mockRestore();
    });
  });

  describe('validateTransition', () => {
    it('should throw an error for invalid persona transition', () => {
      expect(() => stateMachine.validateTransition('INIT', 'DEVELOPER'))
        .toThrow('Invalid transition from INIT to DEVELOPER');
    });

    it('should not throw an error for valid persona transition', () => {
      expect(() => stateMachine.validateTransition('INIT', 'PM'))
        .not.toThrow();
    });
  });

  describe('TransitionRules', () => {
    it('should correctly evaluate transition validity, get transitions, and add transitions', () => {
      const rules = stateMachine.transitionRules;
      expect(rules.isValid('INIT', 'PM')).toBe(true);
      expect(rules.isValid('INIT', 'UNKNOWN')).toBe(false);
      expect(rules.isValid('UNKNOWN', 'PM')).toBeFalsy();

      expect(rules.getValidTransitions('INIT')).toEqual(['PM', 'SYSTEM']);
      expect(rules.getValidTransitions('UNKNOWN')).toEqual([]);

      rules.addTransition('INIT', 'CUSTOM');
      expect(rules.isValid('INIT', 'CUSTOM')).toBe(true);

      rules.addTransition('NEW_ROLE', 'PM');
      expect(rules.isValid('NEW_ROLE', 'PM')).toBe(true);
    });
  });

  describe('formatHandoverLog last activity', () => {
    it('should include ISO timestamp for last activity when handoverLog is non-empty', async () => {
      stateMachine.handoverLog = [
        {
          timestamp: new Date('2025-01-01T12:00:00Z'),
          from: 'INIT',
          to: 'PM',
          artifacts: 'Spec'
        }
      ];
      await stateMachine.saveHandoverLog();
      const writtenContent = fs.writeFile.mock.calls[0][1];
      expect(writtenContent).toContain('2025-01-01T12:00:00.000Z');
    });
  });


  describe('createHandoverLog', () => {
    it('should call saveHandoverLog', async () => {
      jest.spyOn(stateMachine, 'saveHandoverLog').mockResolvedValue();
      await stateMachine.createHandoverLog();
      expect(stateMachine.saveHandoverLog).toHaveBeenCalled();
    });
  });

});
