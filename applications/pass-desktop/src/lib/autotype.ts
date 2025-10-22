import type { BrowserWindow } from 'electron';

import type { AutotypeProperties, MaybeNull } from '@proton/pass/types';
import { wait } from '@proton/shared/lib/helpers/promise';

import { Autotype, clipboard } from '../../native';
import logger from '../utils/logger';
import { setupIpcHandler } from './ipc';
import { hideWindow } from './window-management';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'autotype:execute': IPCChannel<[props: AutotypeProperties], void>;
    }
}

let autotypeInstance: MaybeNull<Autotype> = null;

// Instantiating Autotype more than once can create an error on Linux
const getAutotypeInstance = (): Autotype => {
    if (!autotypeInstance) {
        logger.info(`[Autotype] Initializing autotype...`);
        autotypeInstance = new Autotype();
        logger.info(`[Autotype] Autotype initialized`);
    }
    return autotypeInstance;
};

export const setupIpcHandlers = (getWindow: () => MaybeNull<BrowserWindow>) => {
    setupIpcHandler('autotype:execute', async (_, { fields, enterAtTheEnd }) => {
        const mainWindow = getWindow();
        if (!mainWindow) return;

        const autotype = getAutotypeInstance();
        hideWindow(mainWindow);
        await wait(1000);

        const performAutotypeSeparator = ({
            i,
            length,
            enterAtTheEnd,
        }: {
            i: number;
            length: number;
            enterAtTheEnd?: boolean;
        }) => {
            if (i < length - 1) {
                autotype.tab();
            } else if (enterAtTheEnd) {
                autotype.enter();
            }
        };

        /* On Linux, the autotype library (enigo with libei feature)
         * cannot type special characters with autotype.text(),
         * so we copy the field value in clipboard and paste it instead.
         * Related issue: https://github.com/enigo-rs/enigo/issues/404. */
        if (BUILD_TARGET === 'linux') {
            // Save current clipboard value to restore it after autotype is done
            const initialClipboardValue = await clipboard.read().catch(() => '');

            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];
                await clipboard.writeText(field, true);
                // Waiting to avoid race conditions between clipboard and pasting
                await wait(300);
                autotype.paste();
                await wait(300);
                performAutotypeSeparator({ i, length: fields.length, enterAtTheEnd });
            }

            await clipboard.writeText(initialClipboardValue, true);
        } else {
            fields.forEach((field, i) => {
                autotype.text(field);
                performAutotypeSeparator({ i, length: fields.length, enterAtTheEnd });
            });
        }
    });
};
