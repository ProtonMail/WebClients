import type { BrowserWindow } from 'electron';

import type { MaybeNull } from '@proton/pass/types';

import { napi_native_messaging } from '../../../native';
import logger from '../../utils/logger';
import { getHostLocation, getSockLocation } from './config';
import { setupElectronIpcHandlers } from './electron-ipc';
import { hostSockLoop } from './host-ipc';

const log = (...content: any[]) => logger.debug('[NativeMessaging]', ...content);

export const nativeMessaging = async (app: Electron.App, getWindow: () => MaybeNull<BrowserWindow>) => {
    const config = {
        hostLocation: getHostLocation(app),
        sockLocation: await getSockLocation(app),
    };

    // Install Native Messaging manifests
    try {
        log(`Installing manifests...`);
        await napi_native_messaging.install(config.hostLocation);
    } catch (error) {
        log('Install failed', error);
    }

    // Setup Electron IPC sender and receiver
    const { sendRequestToView } = setupElectronIpcHandlers(getWindow);

    // Listen to host messages with a socket system
    // Returns a cleanup function to close the socket
    return hostSockLoop({
        sockLocation: config.sockLocation,
        // On message from host, send it to view
        onMessage: sendRequestToView,
    });
};
