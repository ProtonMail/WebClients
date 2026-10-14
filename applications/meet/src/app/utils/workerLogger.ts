export type WorkerLogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

// Use inside a Worker: forwards logs to the main thread.
export const createWorkerLogger = (source: string) => {
    const send = (level: WorkerLogLevel, message: string, args: unknown[]) => {
        (self as unknown as Worker).postMessage({ __workerLog: true, source, level, message, args });
    };

    return {
        log: (message: string, ...args: unknown[]) => send('log', message, args),
        info: (message: string, ...args: unknown[]) => send('info', message, args),
        warn: (message: string, ...args: unknown[]) => send('warn', message, args),
        error: (message: string, ...args: unknown[]) => send('error', message, args),
        debug: (message: string, ...args: unknown[]) => send('debug', message, args),
    };
};
