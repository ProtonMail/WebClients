import type { BrowserWindow } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

import { setupIpcHandler } from './ipc';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'router:navigate': IPCChannel<[href: string], void>;
    }
}

export const setupIpcHandlers = (getWindow: () => MaybeNull<BrowserWindow>) => {
    setupIpcHandler('router:navigate', async (_, href) => {
        const window = getWindow();
        await window?.loadURL(`${MAIN_WINDOW_WEBPACK_ENTRY}?#${href}`);
        window?.reload();
    });
};
