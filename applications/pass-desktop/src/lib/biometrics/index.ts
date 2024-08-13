import { ipcMain } from 'electron';
import { platform } from 'os';

import type { BiometricsFactory, BiometricsPlatformHandler } from './types';

const factory: BiometricsFactory = (getWindow) => {
    const platformImplementation: BiometricsPlatformHandler = (() => {
        switch (platform()) {
            case 'win32':
                return (require('./biometrics.windows').default as BiometricsFactory)(getWindow);
            case 'darwin':
                return (require('./biometrics.macos').default as BiometricsFactory)(getWindow);
            default:
                return {
                    canCheckPresence: async () => false,
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

    return platformImplementation;
};

export default factory;
