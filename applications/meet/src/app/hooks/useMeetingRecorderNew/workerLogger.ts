type Level = 'log' | 'info' | 'warn' | 'error' | 'debug';

// Use inside a Worker: forwards console output to the main thread.
export const createWorkerLogger = (source: string) => {
    const send = (level: Level, args: unknown[]) => {
        (self as unknown as Worker).postMessage({ __workerLog: true, source, level, args });
    };

    return {
        log: (...args: unknown[]) => send('log', args),
        info: (...args: unknown[]) => send('info', args),
        warn: (...args: unknown[]) => send('warn', args),
        error: (...args: unknown[]) => send('error', args),
        debug: (...args: unknown[]) => send('debug', args),
    };
};

// Use on the main thread inside a worker's onmessage handler.
// Returns true when the event was a log (so the caller can bail out of its own handling).
export const forwardWorkerLog = (data: any): boolean => {
    if (!data?.__workerLog) {
        return false;
    }

    // eslint-disable-next-line no-console
    (console[data.level as Level] ?? console.log)(`[${data.source}]`, ...data.args);
    return true;
};
