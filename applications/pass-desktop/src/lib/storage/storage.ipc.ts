import type { Session } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

import { setupIpcHandler } from '../ipc';
import { flushStorageData } from './storage.flush';

declare module '../ipc' {
    interface IPCChannels {
        'storage:flush': IPCChannel<[void], void>;
    }
}

export const setupIpcHandlers = (getSession: () => MaybeNull<Session>) => {
    setupIpcHandler('storage:flush', () => flushStorageData(getSession()));
};
