import type { BrowserWindow } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

import { setupIpcHandler } from './ipc';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'window:show': IPCChannel<[void], void>;
        'window:hide': IPCChannel<[void], void>;
    }
}

export const setupIpcHandlers = (getWindow: () => MaybeNull<BrowserWindow>) => {
    setupIpcHandler('window:show', async (_) => getWindow()?.show());
};

export const onHideWindow = (getWindow: () => MaybeNull<BrowserWindow>) => {
    getWindow()?.webContents.send('window:hide');
};
