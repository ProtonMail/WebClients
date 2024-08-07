import { ipcMain } from 'electron';
import { platform } from 'os';

import type { BiometricsPlatformHandler } from './types';

const platformImplementation: BiometricsPlatformHandler = (() => {
    switch (platform()) {
        case 'win32':
            return require('./biometrics.windows').default;
        case 'darwin':
            return require('./biometrics.macos').default;
        default:
            return {
                canCheckPresence: () => false,
                checkPresence: () => Promise.reject('Not implemented'),
                getDecryptionKey: () => Promise.reject('Not implemented'),
                getSecret: () => Promise.reject('Not implemented'),
                deleteSecret: () => Promise.reject('Not implemented'),
                setSecret: () => Promise.reject('Not implemented'),
            };
    }
})();

ipcMain.handle('biometrics:canCheckPresence', platformImplementation.canCheckPresence);
ipcMain.handle('biometrics:checkPresence', platformImplementation.checkPresence);
ipcMain.handle('biometrics:getDecryptionKey', platformImplementation.getDecryptionKey);
ipcMain.handle('biometrics:getSecret', platformImplementation.getSecret);
ipcMain.handle('biometrics:setSecret', platformImplementation.setSecret);
ipcMain.handle('biometrics:deleteSecret', platformImplementation.deleteSecret);
