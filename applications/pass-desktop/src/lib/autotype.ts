import type { BrowserWindow } from 'electron';

import type { AutotypeProperties, MaybeNull } from '@proton/pass/types';
import { wait } from '@proton/shared/lib/helpers/promise';

import { autotype } from '../../native';
import { setupIpcHandler } from './ipc';
import { hideWindow } from './window-management';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'autotype:execute': IPCChannel<[props: AutotypeProperties], void>;
    }
}

export const setupIpcHandlers = (getWindow: () => MaybeNull<BrowserWindow>) => {
    setupIpcHandler('autotype:execute', async (_, { fields, enterAtTheEnd }) => {
        const mainWindow = getWindow();
        if (!mainWindow) return;

        hideWindow(mainWindow);
        await wait(1000);

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            await autotype.text(field);

            if (i < fields.length - 1) {
                await autotype.tab();
            } else if (enterAtTheEnd) {
                await autotype.enter();
            }
        }
    });
};
