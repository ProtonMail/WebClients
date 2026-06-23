import type { Session } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

import logger from '../../utils/logger';
import { setupIpcHandler } from '../ipc';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'storage:flush': IPCChannel<[void], void>;
    }
}

/** Forces Chromium to write any unwritten DOMStorage data (the persisted
 * session blob lives in `localStorage`) to disk. Chromium flushes DOMStorage
 * asynchronously, so an abrupt termination (OS reboot) can drop the latest
 * write — losing e.g. a freshly created biometric lock. */
export const setupIpcHandlers = (getSession: () => MaybeNull<Session>) => {
    setupIpcHandler('storage:flush', () => {
        const session = getSession();
        logger.debug(`[storage] flushing DOMStorage to disk (session=${Boolean(session)})`);
        session?.flushStorageData();
    });
};
