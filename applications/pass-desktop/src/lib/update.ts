import type { Session } from 'electron';
import { checkForUpdates, setTagCookie } from 'proton-pass-desktop/update';

import type { MaybeNull } from '@proton/pass/types';

import { store } from '../store';
import { setupIpcHandler } from './ipc';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'update:setBetaOptIn': IPCChannel<[optIn: boolean], void>;
        'update:getBetaOptIn': IPCChannel<[], boolean>;
        'update:checkNow': IPCChannel<[], boolean>;
    }
}

export const setupIpcHandlers = (getSession: () => MaybeNull<Session>) => {
    setupIpcHandler('update:setBetaOptIn', async (_, optIn) => {
        store.set('optInForBeta', optIn);
        const session = getSession();
        if (session) await setTagCookie(session);
    });
    setupIpcHandler('update:getBetaOptIn', () => store.get('optInForBeta') ?? false);
    setupIpcHandler('update:checkNow', () => {
        const session = getSession();
        if (!session) throw new Error('No sessions found');
        return checkForUpdates(session);
    });
};
