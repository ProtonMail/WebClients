import type { BrowserWindow, Session } from 'electron';
import { app, autoUpdater } from 'electron';

import type { MaybeNull } from '@proton/pass/types';
import type { UpdateStore } from '@proton/pass/types/desktop';
import { UpdateStatus } from '@proton/pass/types/desktop';

import logger from '../../utils/logger';
import { isMac, isWindows } from '../../utils/platform';
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
        if (getUpdateStore().mockDownload) {
            logger.log('[Update] Mock mode: would install', getUpdateStore().newVersion);
            setUpdateStore({ status: UpdateStatus.Idle });
            app.relaunch();
            app.quit();
            return;
        }
        if (isMac()) {
            setUpdateStore({ status: UpdateStatus.Idle });
            autoUpdater.quitAndInstall();
        } else if (isWindows()) {
            // The MSIX registration is deferred until the package is no longer in use, and
            // `app.relaunch()` re-execs the old binary in place — keeping it in use, so the staged
            // version never registers. Quit fully instead: the update applies on exit and the user
            // reopens into the new version.
            app.quit();
        }
    });

    onUpdateStore((newValue) => {
        if (newValue) getWindow()?.webContents.send('update:onUpdateStoreChange', newValue);
    });
};
