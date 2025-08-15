import { ARGON2_PARAMS, CryptoProxy } from '@proton/crypto';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { captureMessage } from '../helpers/sentry';

export interface OfflineKey {
    password: string;
    salt: string;
}

export const getOfflineKey = (password: string, salt: Uint8Array<ArrayBuffer>) => {
    return CryptoProxy.computeArgon2({
        params: ARGON2_PARAMS.RECOMMENDED,
        password,
        salt,
    });
};

export const generateOfflineKey = async (clearKeyPassword: string): Promise<OfflineKey | undefined> => {
    try {
        const salt = crypto.getRandomValues(new Uint8Array(32));
        const key = await getOfflineKey(clearKeyPassword, salt);
        return {
            password: uint8ArrayToBase64String(key),
            salt: uint8ArrayToBase64String(salt),
        };
    } catch (e: any) {
        captureMessage('Argon2 error', { level: 'info', extra: { message: e.message } });
        return;
    }
};
