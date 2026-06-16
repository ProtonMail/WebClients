/// <reference path="../../globals.d.ts" />
import log from 'loglevel';

import noop from '@proton/utils/noop';

export const logId = (id: string) =>
    id.length > 10 ? `[${id.slice(0, 5)}…${id.slice(id.length - 5, id.length)}]` : `[${id}]`;

const EXTERNAL_IMPORT = typeof BUILD_TARGET === 'undefined' || typeof ENV === 'undefined';

// Needed to prevent console output from polluting the root logger
const passLog = log.getLogger('pass');

/** Swallows all console outputs */
if (EXTERNAL_IMPORT || ENV !== 'development') passLog.methodFactory = () => noop;

export const registerLoggerEffect = (effect: (...args: any[]) => void) => {
    const originalFactory = passLog.methodFactory;

    passLog.methodFactory = function (methodName, logLevel, loggerName) {
        const originalMethod = originalFactory(methodName, logLevel, loggerName);

        return function (...logs: any[]) {
            try {
                effect(...logs.map((log) => (log instanceof Error ? log.message : log)));
                originalMethod(...logs);
            } catch {}
        };
    };

    passLog.rebuild();
};

passLog.setLevel(
    (() => {
        if (EXTERNAL_IMPORT) return 'SILENT';
        return ENV === 'development' ? 'DEBUG' : 'INFO';
    })(),
    false
);

export const logger = passLog;
