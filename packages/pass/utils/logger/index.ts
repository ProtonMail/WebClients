import log from 'loglevel';

/** re-import the globals in case any pass code
 * is loaded outside of our build pipeline */
import '../../globals.d';

export const logId = (id: string) =>
    id.length > 10 ? `[${id.slice(0, 5)}…${id.slice(id.length - 5, id.length)}]` : `[${id}]`;

export const registerLoggerEffect = (effect: (...args: any[]) => void) => {
    const originalFactory = log.methodFactory;

    log.methodFactory = function (methodName, logLevel, loggerName) {
        const originalMethod = originalFactory(methodName, logLevel, loggerName);

        return function (...logs: any[]) {
            effect(...logs.map((log) => (log instanceof Error ? log.message : log)));
            if (ENV === 'development') originalMethod(...logs);
        };
    };

    log.rebuild();
};

log.setLevel(
    (() => {
        if (typeof BUILD_TARGET === 'undefined' || typeof ENV === 'undefined') return 'SILENT';
        return ENV === 'development' ? 'DEBUG' : 'INFO';
    })(),
    false
);

export const logger = log;
