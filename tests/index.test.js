describe('Main Index (src/index.js)', () => {
  let consoleSpy;
  let index;

  beforeEach(() => {
    jest.resetModules();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    index = require('../src/index');
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('exports correct metadata configuration object', () => {
    expect(index).toBeDefined();
    expect(index.name).toBe('AION');
    expect(index.version).toBe('1.0.0-alpha.1');
    expect(index.description).toContain('AI Orchestration Native');
  });

  test('logs startup banner to console', () => {
    expect(consoleSpy).toHaveBeenCalled();
  });
});
