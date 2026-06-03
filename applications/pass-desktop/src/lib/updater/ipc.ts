import type { BrowserWindow, Session } from 'electron';
import { app, autoUpdater } from 'electron';

import type { MaybeNull } from '@proton/pass/types';
import type { UpdateStore } from '@proton/pass/types/desktop';
import { UpdateStatus } from '@proton/pass/types/desktop';

import logger from '../../utils/logger';
import { isMac, isProdEnv, isWindows } from '../../utils/platform';
import { setupIpcHandler } from '../ipc';
import { setTagCookie } from './helpers';
import { getUpdateStore, onUpdateStore, setUpdateStore } from './store';
import { checkForUpdates } from './updater';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'update:getUpdateStore': IPCChannel<[], UpdateStore>;
        'update:setUpdateStore': IPCChannel<[update: Partial<UpdateStore>], void>;
        'update:onUpdateStoreChange': IPCChannel<[UpdateStore], void>;
        'update:checkNow': IPCChannel<[], boolean>;
        'update:restartToUpdate': IPCChannel<[], void>;
    }
}

export const setupIpcHandlers = (getWindow: () => MaybeNull<BrowserWindow>, getSession: () => MaybeNull<Session>) => {
    setupIpcHandler('update:getUpdateStore', () => getUpdateStore());
    setupIpcHandler('update:setUpdateStore', async (update) => {
        setUpdateStore(update);
        if (update.beta !== undefined) {
            const session = getSession();
            if (session) await setTagCookie(session, update.beta);
        }
    });
    setupIpcHandler('update:checkNow', () => {
        const session = getSession();
        if (!session) throw new Error('No sessions found');
        return checkForUpdates(session);
    });
    setupIpcHandler('update:restartToUpdate', () => {
        logger.log('[Update] restartToUpdate');
        if (!isProdEnv()) {
            logger.log('[Update] Dev mode: would install', getUpdateStore().newVersion);
            setUpdateStore({ status: UpdateStatus.Idle });
            app.relaunch();
            app.quit();
            return;
        }
        if (isMac()) {
            setUpdateStore({ status: UpdateStatus.Idle });
            autoUpdater.quitAndInstall();
        } else if (isWindows()) {
            app.relaunch();
            app.quit();
        }
    });

    onUpdateStore((newValue) => {
        if (newValue) getWindow()?.webContents.send('update:onUpdateStoreChange', newValue);
    });
};
