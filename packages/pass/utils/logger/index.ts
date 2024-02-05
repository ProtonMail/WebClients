import log from 'loglevel';

import type { Callback } from '@proton/pass/types';

/** re-import the globals in case any pass code
 * is loaded outside of our build pipeline */
import '../../globals.d';

log.setLevel(
    (() => {
        if (typeof BUILD_TARGET === 'undefined' || typeof ENV === 'undefined') return 'SILENT';
        if (BUILD_TARGET !== 'web') return 'INFO';
        return ENV === 'development' ? 'INFO' : 'SILENT';
    })(),
    false
);

export const logId = (id: string) =>
    id.length > 10 ? `[${id.slice(0, 5)}…${id.slice(id.length - 5, id.length)}]` : `[${id}]`;

type LoggerOptions = { onLog?: (log: string, originalLog: LogFunc) => void };
type LogFunc = Callback<any[], void>;

const withLoggerOptions =
    <F extends LogFunc>(fn: F, options: LoggerOptions): ((...args: any[]) => void) =>
    (...args) =>
        options.onLog ? options.onLog(args.join(' '), fn) : fn(...args);

export const logger = (() => {
    const options: LoggerOptions = {};

    return {
        info: withLoggerOptions(log.info, options),
        debug: withLoggerOptions(log.debug, options),
        error: withLoggerOptions(log.error, options),
        warn: withLoggerOptions(log.warn, options),
        setLogOptions: (opts: LoggerOptions) => (options.onLog = opts.onLog),
    };
})();
