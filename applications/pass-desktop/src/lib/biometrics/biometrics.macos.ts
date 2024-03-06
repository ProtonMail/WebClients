import { systemPreferences } from 'electron';

import { biometric as macBiometrics } from '../../../native';
import type { BiometricsPlatformHandler } from './types';

/** reason is prefixed by 'Proton Pass wants to' */
const checkPresence = async (reason = 'unlock') => {
    try {
        await systemPreferences.promptTouchID(reason);
        return true;
    } catch (_e) {
        return false;
    }
};

const biometrics: BiometricsPlatformHandler = {
    canCheckPresence: async () => systemPreferences.canPromptTouchID(),
    checkPresence: async (_e: Electron.IpcMainInvokeEvent, reason?: string) => checkPresence(reason),
    getDecryptionKey: async () => Promise.resolve(null),
    getSecret: async (_e, key) => {
        if (!(await checkPresence())) throw new Error('Biometric authentication failed');
        let res: string | null = null;
        try {
            res = await macBiometrics.getSecret(key);
        } catch (_e) {}
        return res;
    },
    setSecret: async (_e, key, secret) => macBiometrics.setSecret(key, secret),
    deleteSecret: async (_e, key) => macBiometrics.deleteSecret(key),
};

export default biometrics;
