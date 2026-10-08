import type { BrowserWindow } from 'electron';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { MaybeNull } from '@proton/pass/types';

import { napi_native_messaging } from 'proton-pass-desktop-native';

import logger from '../../utils/logger';
import { isProdEnv, isWindows } from '../../utils/platform';
import { getFirefoxHostLocation, getHostLocation, getPackagedHostSource, getSockLocation } from './config';
import { setupElectronIpcHandlers } from './electron-ipc';
import { hostSockLoop } from './host-ipc';

const log = (...content: any[]) => logger.debug('[NativeMessaging]', ...content);

export const nativeMessaging = async (app: Electron.App, getWindow: () => MaybeNull<BrowserWindow>) => {
    const config = {
        hostLocation: getHostLocation(app),
        firefoxHostLocation: getFirefoxHostLocation(app),
        sockLocation: await getSockLocation(app),
    };

    // On packaged Windows, Firefox can't launch the in-package alias stub — copy
    // the real host exe out to a launchable folder it can spawn. Refreshed each
    // launch (cheap), keeping it stable across app updates.
    if (isWindows() && isProdEnv()) {
        const source = getPackagedHostSource(app);
        try {
            await mkdir(dirname(config.firefoxHostLocation), { recursive: true });
            await copyFile(source, config.firefoxHostLocation);
        } catch (error) {
            /** A running Firefox host can hold the copy (EBUSY); the previous copy stays
             * usable, so log and proceed rather than failing startup. `warn` (not debug):
             * a persistent failure silently breaks Firefox-on-Windows unlock. */
            logger.warn('[NativeMessaging] Firefox host copy failed', error);
        }
    }

    // Install Native Messaging manifests
    try {
        log(`Installing manifests...`);
        await napi_native_messaging.install(config.hostLocation, config.firefoxHostLocation);
    } catch (error) {
        /** `warn` (not debug): a failed manifest install means native messaging is
         * unregistered and the whole desktop-unlock feature is dead for this user. */
        logger.warn('[NativeMessaging] Install failed', error);
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
