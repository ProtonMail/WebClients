import { KEY_LENGTH_BYTES } from '@proton/crypto/lib/subtle/aesGcm';
import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

import { biometric as winBiometrics } from '../../../native';
import type { BiometricsFactory, BiometricsPlatformHandler } from './types';

const factory: BiometricsFactory = (getWindow) => {
    const checkPresence = async (reason = 'Proton Pass wants to unlock') => {
        const handle = getWindow()?.getNativeWindowHandle();
        if (!handle) return false;
        return winBiometrics.checkPresence(handle, reason).catch(() => false);
    };

    const biometrics: BiometricsPlatformHandler = {
        canCheckPresence: () => winBiometrics.canCheckPresence().catch(() => false),
        checkPresence: (_, reason) => checkPresence(reason),
        getDecryptionKey: (_, challenge) => winBiometrics.getDecryptionKey(challenge).catch(() => null),
        getSecret: async (_, key, version) => {
            if (!(await checkPresence())) throw new Error('Biometric authentication failed');

            const secretBytes = await winBiometrics.getSecret(key).catch(() => null);
            if (!secretBytes) return null;

            /** Version 1 (Legacy): Secrets were stored as UTF-16 encoded strings in a Vec<u8>,
             * retrieved via `U16String::from_ptr`. Now stored as `Uint8`. For retrocompatibility:
             * 1. Reinterpret Uint8Array, extracting first byte of each UTF-16 pair
             * 2. Slice to KEY_LENGTH_BYTES for correct secret length */
            if (version === 1) {
                const secretBytesUint8 = (() => {
                    const bytes = new Uint8Array(Math.floor(secretBytes.length / 2));
                    for (let i = 0, j = 0; i < secretBytes.length; i += 2, j++) bytes[j] = secretBytes[i];
                    return bytes.slice(0, KEY_LENGTH_BYTES);
                })();

                return uint8ArrayToString(secretBytesUint8);
            }

            /* Version 2+: Secrets are stored as raw byte arrays without
             * any conversions to and from strings */
            return uint8ArrayToString(secretBytes);
        },
        setSecret: (_, key, secret) => winBiometrics.setSecret(key, secret),
        deleteSecret: (_, key) => winBiometrics.deleteSecret(key),
    };

    return biometrics;
};

export default factory;
