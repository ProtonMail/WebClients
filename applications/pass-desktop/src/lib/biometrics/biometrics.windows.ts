import { biometric as winBiometrics } from '../../../native';
import { mainWindow } from '../../main';
import type { BiometricsPlatformHandler } from './types';

const checkPresence = async (reason = 'Proton Pass wants to unlock') => {
    const handle = mainWindow?.getNativeWindowHandle();
    if (!handle) return false;
    return winBiometrics.checkPresence(handle, reason).catch(() => false);
};

const biometrics: BiometricsPlatformHandler = {
    canCheckPresence: async () => {
        return winBiometrics.canCheckPresence().catch(() => false);
    },
    checkPresence: async (_event: Electron.IpcMainInvokeEvent, reason?: string) => checkPresence(reason),
    getDecryptionKey: async (_event: Electron.IpcMainInvokeEvent, challenge: string) => {
        return winBiometrics.getDecryptionKey(challenge).catch(() => null);
    },
    getSecret: async (_e, key) => {
        if (!(await checkPresence())) throw new Error('Biometric authentication failed');
        let res: string | null = null;
        try {
            res = await winBiometrics.getSecret(key);
        } catch (_e) {}
        return res;
    },
    setSecret: async (_e, key, secret) => winBiometrics.setSecret(key, secret),
    deleteSecret: async (_e, key) => winBiometrics.deleteSecret(key),
};

export default biometrics;
