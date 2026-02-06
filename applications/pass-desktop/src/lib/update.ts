import type { Session } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

import { msix_updater } from '../../native';
import { store } from '../store';
import { checkForUpdates, setTagCookie } from '../update';
import logger from '../utils/logger';
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
        logger.log(`[Update] dev log: ipc handler check now`);

        const session = getSession();
        if (!session) throw new Error('No sessions found');
        return checkForUpdates(session);
    });
};

export const installWindowsUpdate = async (buildUri: string) => msix_updater.installUpdate(buildUri);
