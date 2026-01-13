import type { BrowserWindow } from 'electron';

import type { AutotypeProperties, MaybeNull } from '@proton/pass/types';
import { wait } from '@proton/shared/lib/helpers/promise';

import { Autotype } from '../../native';
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
const getAutotypeInstance = async (): Promise<Autotype> => {
    if (!autotypeInstance) {
        logger.info(`[Autotype] Initializing autotype...`);
        autotypeInstance = await Autotype.create();
        logger.info(`[Autotype] Autotype initialized`);
    }
    return autotypeInstance;
};

export const setupIpcHandlers = (getWindow: () => MaybeNull<BrowserWindow>) => {
    setupIpcHandler('autotype:execute', async (_, { fields, enterAtTheEnd }) => {
        const mainWindow = getWindow();
        if (!mainWindow) return;

        const autotype = await getAutotypeInstance();
        hideWindow(mainWindow);
        await wait(1000);

        autotype.performAutotype(fields, enterAtTheEnd);
    });
};
