import { systemPreferences } from 'electron';

import { utf8ArrayToString } from '@proton/crypto/lib/utils';
import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

import { biometric as macBiometrics } from '../../../native';
import type { BiometricsFactory, BiometricsPlatformHandler } from './types';

const factory: BiometricsFactory = () => {
    /** reason is prefixed by 'Proton Pass wants to' */
    const checkPresence = async (reason = 'unlock') => {
        try {
            await systemPreferences.promptTouchID(reason);
            return true;
        } catch (_) {
            return false;
        }
    };

    const biometrics: BiometricsPlatformHandler = {
        canCheckPresence: () => Promise.resolve(true),
        checkPresence: (_, reason) => checkPresence(reason),
        getDecryptionKey: () => Promise.resolve(null),
        getSecret: async (_, key, version) => {
            if (!(await checkPresence())) throw new Error('Biometric authentication failed');

            const secretBytes = await macBiometrics.getSecret(key).catch(() => null);
            if (!secretBytes) return null;

            /** Version 1 (Legacy): Secrets were stored as UTF-8 encoded strings.
             * Rust would store the bytes of this string using `as_bytes()` and
             * retrieve using `String::from_utf8()`. As such treat the uint8 array
             * as an utf8 array for proper string conversion */
            if (version === 1) return utf8ArrayToString(secretBytes);

            /* Version 2+: Secrets are stored as raw byte arrays without
             * any conversions to and from strings */
            return uint8ArrayToString(secretBytes);
        },
        setSecret: (_, key, secret) => macBiometrics.setSecret(key, secret),
        deleteSecret: (_, key) => macBiometrics.deleteSecret(key),
    };
    return biometrics;
};

export default factory;
