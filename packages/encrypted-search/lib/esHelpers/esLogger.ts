import noop from '@proton/utils/noop';

/**
 * Minimal logging surface encrypted-search needs. This is deliberately not tied to any specific
 * logging implementation (e.g. `@proton/logger`) — encrypted-search is used by mail, calendar and
 * drive, and has no way to know which of them, if any, has initialized a particular logger
 * singleton. Assuming one implicitly would be a hidden dependency: logs would silently vanish in
 * any host application that hasn't set one up, with nothing in this package's API surface hinting
 * that it depends on external, app-owned global state.
 *
 * Without a call to `setESLogger`, this is a silent no-op.
 */
export interface ESLogger {
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
}

const noopESLogger: ESLogger = { info: noop, warn: noop, error: noop };

let esLogger: ESLogger = noopESLogger;

/**
 * Called once by the host application if it wants encrypted-search's indexing/search progress
 * and failures to show up in its own local, shareable logs (e.g. wiring in its `@proton/logger`
 * instance). Optional: encrypted-search works the same either way, just silently either way.
 */
export const setESLogger = (logger: ESLogger) => {
    esLogger = logger;
};

export const getESLogger = () => esLogger;
