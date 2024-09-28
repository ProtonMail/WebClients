import type { BrowserWindow } from 'electron';
import { ipcMain } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

export default (getWindow: () => MaybeNull<BrowserWindow>) => {
    ipcMain.handle('router:navigate', async (_, href: string) => {
        const window = getWindow();
        await window?.loadURL(`${MAIN_WINDOW_WEBPACK_ENTRY}?#${href}`);
        window?.reload();
    });
};
