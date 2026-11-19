import type log from 'loglevel';

const loglevel = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    setLevel: vi.fn(),
    setDefaultLevel: vi.fn(),
    getLevel: vi.fn(),
    enableAll: vi.fn(),
    disableAll: vi.fn(),
    getLoggers: vi.fn(),
    rebuild: vi.fn(),
    levels: { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, SILENT: 5 },
    getLogger: vi.fn(() => loglevel),
} as unknown as typeof log;

export default loglevel;
