import type { BrowserWindow } from 'electron';
import { c } from 'ttag';

import type { MaybeNull } from '@proton/pass/types/utils';

import config from '../app/config';
import type { PassElectronContext } from '../types';
import { setupIpcHandler } from './ipc';

declare module './ipc' {
    interface IPCChannels {
        'router:navigate': IPCChannel<[href: string], void>;
        'router:getBackLabel': IPCChannel<[], string>;
        'router:goBackFromAccount': IPCChannel<[], void>;
    }
}

export const getBackLabel = () => c('App menu').t`Back`;

const loadApp = async (window: MaybeNull<BrowserWindow>, href: string) => {
    await window?.loadURL(`${MAIN_WINDOW_WEBPACK_ENTRY}?#${href}`);
    window?.reload();
};

/** The app reaches Account with `location.replace`, so there is no history to go
 * back to: reload the app on the account it left. Does nothing outside Account. */
export const goBackFromAccount = async ({ window, originHref }: PassElectronContext) => {
    if (window?.webContents.getURL().startsWith(config.SSO_URL)) await loadApp(window, originHref);
};

export const setupIpcHandlers = (ctx: PassElectronContext) => {
    setupIpcHandler('router:navigate', (href) => loadApp(ctx.window, href));
    setupIpcHandler('router:getBackLabel', getBackLabel);
    setupIpcHandler('router:goBackFromAccount', () => goBackFromAccount(ctx));
};
