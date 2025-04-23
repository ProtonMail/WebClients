import type { BrowserWindow } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

import { setupIpcHandler } from './ipc';

export const setupIpcHandlers = (getWindow: () => MaybeNull<BrowserWindow>) => {
    setupIpcHandler('router:navigate', async (_, href: string) => {
        const window = getWindow();
        await window?.loadURL(`${MAIN_WINDOW_WEBPACK_ENTRY}?#${href}`);
        window?.reload();
    });
};
