import type { Logger } from '../utils/logger';

/** A logger for tests, which logs nothing */
export const silentLogger: Logger = {
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    log: () => {},
};
