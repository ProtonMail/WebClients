/// <reference path="../../globals.d.ts" />
import log from 'loglevel';

import noop from '@proton/utils/noop';

export const logId = (id: string) =>
    id.length > 10 ? `[${id.slice(0, 5)}…${id.slice(id.length - 5, id.length)}]` : `[${id}]`;

const EXTERNAL_IMPORT = typeof BUILD_TARGET === 'undefined' || typeof ENV === 'undefined';

/** Prevent console output from polluting the root logger */
const PASS_LOGGER = log.getLogger('pass');

/** Swallows all console outputs */
if (EXTERNAL_IMPORT || ENV !== 'development') PASS_LOGGER.methodFactory = () => noop;

export const registerLoggerEffect = (effect: (...args: any[]) => void) => {
    const originalFactory = PASS_LOGGER.methodFactory;

    PASS_LOGGER.methodFactory = function (methodName, logLevel, loggerName) {
        const originalMethod = originalFactory(methodName, logLevel, loggerName);

        return function (...logs: any[]) {
            try {
                effect(...logs.map((log) => (log instanceof Error ? log.message : log)));
                originalMethod(...logs);
            } catch {}
        };
    };

    PASS_LOGGER.rebuild();
};

PASS_LOGGER.setLevel(
    (() => {
        if (EXTERNAL_IMPORT) return 'SILENT';
        return ENV === 'development' ? 'DEBUG' : 'INFO';
    })(),
    false
);

export const logger = PASS_LOGGER;
