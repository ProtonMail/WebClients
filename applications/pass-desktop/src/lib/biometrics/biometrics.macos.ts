import { uint8ArrayToUtf8String } from '@protontech/crypto/utils';

import { uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';

import { biometric as macBiometrics } from 'proton-pass-desktop-native';

import { assertPresenceVerified } from './errors';
import type { BiometricsFactory, BiometricsPlatformHandler } from './types';

const factory: BiometricsFactory = () => {
    /** The native check does not use the window handle on macOS. A cancelled prompt is told
     * apart from a failure by its error code, not by the localized message of the OS. */
    const checkPresence = async (reason = 'unlock Proton Pass') =>
        assertPresenceVerified(await macBiometrics.checkPresence(Buffer.alloc(0), reason));

    const biometrics: BiometricsPlatformHandler = {
        canCheckPresence: () => Promise.resolve(true),
        checkPresence: (reason) => checkPresence(reason),
        getSecret: async (key, version) => {
            await checkPresence();

            const secretBytes = (await macBiometrics.getSecret(key)) as Uint8Array<ArrayBuffer>;
            if (!secretBytes) return null;

            /** Version 1 (Legacy): Secrets were stored as UTF-8 encoded strings.
             * Rust would store the bytes of this string using `as_bytes()` and
             * retrieve using `String::from_utf8()`. As such treat the uint8 array
             * as an utf8 array for proper string conversion */
            if (version === 1) return uint8ArrayToUtf8String(secretBytes);

            /* Version 2+: Secrets are stored as raw byte arrays without
             * any conversions to and from strings */
            return uint8ArrayToBinaryString(secretBytes);
        },
        setSecret: (key, secret) => macBiometrics.setSecret(key, secret),
        deleteSecret: (key) => macBiometrics.deleteSecret(key),
    };
    return biometrics;
};

export default factory;
