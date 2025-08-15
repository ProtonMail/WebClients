import { platform } from 'os';

import type { MaybeNull } from '@proton/pass/types';

import { setupIpcHandler } from '../ipc';
import type { BiometricsFactory, BiometricsPlatformHandler } from './types';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'biometrics:canCheckPresence': IPCChannel<[], boolean>;
        'biometrics:checkPresence': IPCChannel<[reason?: string], void>;
        'biometrics:getSecret': IPCChannel<[key: string, version: number], MaybeNull<string>>;
        'biometrics:setSecret': IPCChannel<[key: string, secret: Uint8Array<ArrayBuffer>], void>;
        'biometrics:deleteSecret': IPCChannel<[key: string], void>;
    }
}

const factory: BiometricsFactory = (getWindow) => {
    const platformImplementation: BiometricsPlatformHandler = (() => {
        switch (platform()) {
            case 'win32':
                return (require('./biometrics.windows').default as BiometricsFactory)(getWindow);
            case 'darwin':
                return (require('./biometrics.macos').default as BiometricsFactory)(getWindow);
            default:
                return {
                    canCheckPresence: () => Promise.resolve(false),
                    checkPresence: () => Promise.reject('Not implemented'),
                    getSecret: () => Promise.reject('Not implemented'),
                    deleteSecret: () => Promise.reject('Not implemented'),
                    setSecret: () => Promise.reject('Not implemented'),
                };
        }
    })();

    setupIpcHandler('biometrics:canCheckPresence', platformImplementation.canCheckPresence);
    setupIpcHandler('biometrics:checkPresence', platformImplementation.checkPresence);
    setupIpcHandler('biometrics:getSecret', platformImplementation.getSecret);
    setupIpcHandler('biometrics:setSecret', platformImplementation.setSecret);
    setupIpcHandler('biometrics:deleteSecret', platformImplementation.deleteSecret);

    return platformImplementation;
};

export default factory;
