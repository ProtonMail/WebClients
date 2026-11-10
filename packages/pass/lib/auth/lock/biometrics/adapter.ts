import { c } from 'ttag';

import { binaryStringToUint8Array, uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';
import noop from '@proton/utils/noop';

import type { PassCoreContextValue } from '../../../../components/Core/PassCoreProvider';
import { PassEncryptionTag } from '../../../../types/crypto/pass-types';
import type { Maybe } from '../../../../types/utils';
import { SilentError, UnlockDeclinedError, UnlockFailedError } from '../../../../utils/errors/errors';
import { getErrorMessage } from '../../../../utils/errors/get-error-message';
import { logger } from '../../../../utils/logger';
import { deobfuscate } from '../../../../utils/obfuscate/xor';
import { getEpoch } from '../../../../utils/time/epoch';
import { generateOfflineComponents } from '../../../cache/crypto';
import { decryptData, encryptData, importSymmetricKey } from '../../../crypto/utils/crypto-helpers';
import { PassCryptoError } from '../../../crypto/utils/errors';
import { loadCoreCryptoWorker } from '../../../crypto/utils/worker';
import type { AuthService } from '../../service';
import type { AuthStore } from '../../store';
import { getInvalidPasswordString } from '../../utils';
import type { LockAdapterBiometrics } from '../types';
import { LockMode } from '../types';
import { fromBiometricsEncryptedOfflineKD, intoBiometricsEncryptedOfflineKD } from './utils';

/** Safeguard: where the platform binds no key (`biometricsKeyAppBound: false`),
 * no biometric key material may be persisted. Callers skip the envelope already. */
export const generateBiometricsKey = async (core: PassCoreContextValue, offlineKD: string): Promise<string> => {
    if (!core.biometricsKeyAppBound) throw new Error('Biometrics key is not app-bound');

    const key = await core.generateBiometricsKey!();
    const rawOfflineKD = binaryStringToUint8Array(offlineKD);
    const rawEncryptedOfflineKD = await encryptData(key, rawOfflineKD, PassEncryptionTag.BiometricOfflineKD);
    return intoBiometricsEncryptedOfflineKD(uint8ArrayToBinaryString(rawEncryptedOfflineKD));
};

/** Resolves the key passed to the biometric unlock. Where the platform binds no
 * key there is nothing to fetch: the gesture is enforced inside the adapter's
 * unlock, and fetching here would prompt a second time. Resolves an empty key
 * in that case, rejects when the platform store read fails. */
export const getBiometricsUnlockKey = async (core: PassCoreContextValue, authStore: AuthStore): Promise<string> => {
    if (!core.biometricsKeyAppBound) return '';
    return (await core.getBiometricsKey?.(authStore)) ?? '';
};

/** Password locking involves the offline configuration. As such,
 * we can only password lock if we have a valid offline config in
 * order to be able to verify the user password locally without an
 * SRP flow. Booting offline should rely on this lock adapter */
export const biometricsLockAdapterFactory = (auth: AuthService, core: PassCoreContextValue): LockAdapterBiometrics => {
    const { authStore, api } = auth.config;
    let lockedOfflineKD: Maybe<string>;

    /** Persist the `unlockRetryCount` without re-encrypting
     * the authentication session blob */
    const setRetryCount = async (unlockRetryCount: number) => {
        if (unlockRetryCount >= 3) {
            authStore.setEncryptedOfflineKD(undefined);
            authStore.setLockMode(LockMode.PASSWORD);
            await auth.syncLock({ unlockRetryCount: 0 });
            await auth.lock(LockMode.PASSWORD, { broadcast: true, soft: true });
            throw new Error(c('Warning').t`Too many attempts`);
        }

        await auth.syncLock({ unlockRetryCount });
    };

    const adapter: LockAdapterBiometrics = {
        type: LockMode.BIOMETRICS,

        check: async () => {
            logger.info(`[BiometricLock] checking lock`);
            if (!authStore.hasOfflineComponents()) return { mode: LockMode.NONE, locked: false };
            return { mode: adapter.type, locked: false, ttl: authStore.getLockTTL() };
        },

        /** Creating a password lock should first verify the user password
         * with SRP. Only then should we compute the offline components.
         * Repersists the session with the `offlineKD` encrypted in the session
         * blob. As such creating a biometrics lock is online-only. */
        create: async (passwordBuff, ttl, onBeforeCreate) => {
            logger.info(`[BiometricLock] creating biometrics lock`);
            const password = deobfuscate(passwordBuff, { zeroize: true });

            const verified = await auth.confirmPassword(password);
            if (!verified) throw new Error(getInvalidPasswordString(authStore));

            if (!authStore.hasOfflinePassword()) {
                const components = await generateOfflineComponents(password);
                authStore.setOfflineComponents(components);
            }

            const offlineKD = authStore.getOfflineKD();
            if (!offlineKD) throw new Error('Missing offline KD');

            /** App-bound platforms wrap the `offlineKD` under a biometric key the OS only
             * releases after a gesture. Where the OS store cannot be bound to the app
             * (Windows), no key material is persisted at all: the biometric lock is a
             * UI lock unlocked by the gesture, not a cryptographic factor.
             * A missing envelope does NOT disable offline mode — the password-derived
             * offline components above are kept, so an offline boot unlocks with the
             * user password through the standard password-unlock verification. */
            const encryptedOfflineKD = core.biometricsKeyAppBound
                ? await generateBiometricsKey(core, offlineKD)
                : undefined;

            await onBeforeCreate?.();

            authStore.setEncryptedOfflineKD(encryptedOfflineKD);
            authStore.setLockMode(adapter.type);
            authStore.setLockTTL(ttl);
            authStore.setLockLastExtendTime(getEpoch());
            authStore.setUnlockRetryCount(0);

            await auth.persistSession().catch(noop);

            return { mode: adapter.type, locked: false, ttl };
        },

        /** Resets every auth store properties relative to offline
         * mode and re-persists the session accordingly */
        delete: async () => {
            logger.info(`[BiometricLock] deleting biometrics lock`);
            authStore.setLockLastExtendTime(undefined);
            authStore.setLockTTL(undefined);
            authStore.setLockMode(LockMode.NONE);
            authStore.setLocked(false);
            authStore.setUnlockRetryCount(0);
            authStore.setEncryptedOfflineKD(undefined);
            lockedOfflineKD = undefined;

            await auth.persistSession().catch(noop);

            return { mode: LockMode.NONE, locked: false };
        },

        /** Password locking should reset the in-memory `OfflineKD`.
         * Remove the session lock token as well preeventively in case
         * a user ends up in a situation with both a password and an
         * API lock - this should not happen.
         *
         * App-unbound model: the gesture-only unlock has nothing to re-derive the
         * `offlineKD` from, and the cache writer drops the `encryptedCacheKey` without
         * it, which would break the next offline cold boot. It is held in this closure
         * while locked and restored on the gesture, so the store never holds an
         * `offlineKD` for a locked session. Lost on reload, where the resume rebuilds
         * it from the persisted session. */
        lock: async () => {
            logger.info(`[BiometricLock] locking session`);
            if (!core.biometricsKeyAppBound) lockedOfflineKD = authStore.getOfflineKD() ?? lockedOfflineKD;
            authStore.setOfflineKD(undefined);
            authStore.setLockToken(undefined);
            authStore.setLocked(true);

            return { mode: adapter.type, locked: true };
        },

        /** Password unlocking involves checking if we can decrypt the
         * `encryptedCacheKey` with the argon2 derivation of the provided
         * secret. The `offlineKD` is encrypted in the session blob, as
         * such, we cannot rely on it for comparison when booting offline.
         * Load the crypto workers early in case password unlocking
         * happens before we boot the application state (hydrate.saga) */
        unlock: async (biometricsSecret: string) => {
            /** App-unbound model (nothing persisted at rest): a UI lock with nothing to
             * decrypt, so the gesture is checked here, inside the unlock, not by the
             * calling UI. Not a cryptographic factor (see `biometricsKeyAppBound`): any
             * same-user process can drive the OS prompt, what it cannot obtain is a
             * key, because none is stored. A denied gesture throws without burning
             * an `unlockRetryCount`: retries guard against brute-forcing a secret,
             * and there is no secret here.
             *
             * Keyed on the platform capability, not on envelope presence: where the
             * platform does bind the key, a missing envelope is a broken lock and must
             * take the path below, which recovers through the password lock.
             *
             * With no secret to decrypt, nothing else ties this unlock to the stored
             * lock mode: without the guard, one gesture would clear a password lock. */
            if (!core.biometricsKeyAppBound) {
                if (authStore.getLockMode() !== LockMode.BIOMETRICS) throw new SilentError();

                await api.reset();
                if (!core.promptBiometricsCheck) throw new SilentError();

                await core.promptBiometricsCheck().catch((err: unknown) => {
                    if (err instanceof UnlockDeclinedError) throw err;
                    throw new UnlockFailedError(getErrorMessage(err));
                });

                if (lockedOfflineKD) authStore.setOfflineKD(lockedOfflineKD);
                lockedOfflineKD = undefined;
                authStore.setLocked(false);
                await auth.syncLock({ unlockRetryCount: 0, lockLastExtendTime: getEpoch() });
                return undefined;
            }

            const retryCount = authStore.getUnlockRetryCount() + 1;

            /** API may have been flagged as sessionLocked before
             * booting offline - as such reset the api state to
             * avoid failing subsequent requests. */
            await api.reset();

            try {
                /** Errors with fetching the biometrics secret
                 * will be handled during fetching it - here we only need
                 * to make sure we're still increasing the count  */
                if (!biometricsSecret) throw new SilentError();

                await loadCoreCryptoWorker();

                const offlineConfig = authStore.getOfflineConfig();
                const offlineVerifier = authStore.getOfflineVerifier();
                const offlineEncryptedKD = authStore.getEncryptedOfflineKD();

                if (!(offlineConfig && offlineVerifier && offlineEncryptedKD)) {
                    throw new PassCryptoError('Invalid biometric lock');
                }

                const biometricsCryptoKey = await importSymmetricKey(binaryStringToUint8Array(biometricsSecret));

                const offlineKD = await decryptData(
                    biometricsCryptoKey,
                    binaryStringToUint8Array(fromBiometricsEncryptedOfflineKD(offlineEncryptedKD).key),
                    PassEncryptionTag.BiometricOfflineKD
                );

                const offlineKey = await importSymmetricKey(offlineKD);

                /** this will throw if the derived offlineKD is incorrect */
                await decryptData(offlineKey, binaryStringToUint8Array(offlineVerifier), PassEncryptionTag.Offline);
                const hash = uint8ArrayToBinaryString(offlineKD);

                authStore.setOfflineKD(hash);
                authStore.setLocked(false);

                await auth.syncLock({ unlockRetryCount: 0, lockLastExtendTime: getEpoch() });
                return hash;
            } catch (err) {
                if (err instanceof PassCryptoError) {
                    /* Fall back to password lock in case the biometrics key can't be decrypted */
                    authStore.setEncryptedOfflineKD(undefined);
                    authStore.setLockMode(LockMode.PASSWORD);
                    await auth.syncLock({ unlockRetryCount: 0 });
                    await auth.lock(LockMode.PASSWORD, { broadcast: true, soft: true });
                    throw err;
                }

                await setRetryCount(retryCount);
                await auth.lock(adapter.type, { broadcast: true, soft: true });
                throw err;
            }
        },
    };

    return adapter;
};
