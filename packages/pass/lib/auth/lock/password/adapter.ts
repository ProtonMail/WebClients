import { noop } from 'lodash';
import { c } from 'ttag';

import { type LockAdapter, LockMode } from '@proton/pass/lib/auth/lock/types';
import type { AuthService } from '@proton/pass/lib/auth/service';
import { getOfflineComponents, getOfflineKeyDerivation } from '@proton/pass/lib/cache/crypto';
import { decryptData, getSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import { PassEncryptionTag } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';

/** Password locking involves the offline configuration. As such,
 * we can only password lock if we have a valid offline config in
 * order to be able to verify the user password locally without an
 * SRP flow. Booting offline should rely on this lock adapter */
export const passwordLockAdapterFactory = (auth: AuthService): LockAdapter => {
    const { authStore, api, getPersistedSession, onSessionPersist } = auth.config;

    /** Persist the `unlockRetryCount` without re-encrypting
     * the authentication session blob */
    const setRetryCount = async (retryCount: number) => {
        authStore.setUnlockRetryCount(retryCount);

        const localID = authStore.getLocalID();
        const encryptedSession = await getPersistedSession(localID);

        if (encryptedSession) {
            encryptedSession.unlockRetryCount = retryCount;
            await onSessionPersist?.(JSON.stringify(encryptedSession));
        }
    };

    const adapter: LockAdapter = {
        type: LockMode.PASSWORD,

        check: async () => {
            logger.info(`[PasswordLock] checking password lock`);

            const offlineConfig = authStore.getOfflineConfig();
            const offlineVerifier = authStore.getOfflineVerifier();
            if (!(offlineConfig && offlineVerifier)) return { mode: LockMode.NONE, locked: false };

            authStore.setLockLastExtendTime(getEpoch());
            return { mode: adapter.type, locked: false, ttl: authStore.getLockTTL() };
        },

        /** Creating a password lock should first verify the user password
         * with SRP. Only then should we compute the offline components.
         * Repersists the session with the `offlineKD` encrypted in the session
         * blob. As such creating a password lock is online-only. */
        create: async ({ secret, ttl }, onBeforeCreate) => {
            logger.info(`[PasswordLock] creating password lock`);

            const verified = await auth.confirmPassword(secret);
            if (!verified) {
                const message = authStore.getExtraPassword()
                    ? c('Error').t`Wrong extra password`
                    : c('Error').t`Wrong password`;
                throw new Error(message);
            }

            await onBeforeCreate?.();

            if (!authStore.hasOfflinePassword()) {
                const { offlineConfig, offlineKD, offlineVerifier } = await getOfflineComponents(secret);
                authStore.setOfflineConfig(offlineConfig);
                authStore.setOfflineKD(offlineKD);
                authStore.setOfflineVerifier(offlineVerifier);
            }

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
            logger.info(`[PasswordLock] deleting password lock`);
            authStore.setLockLastExtendTime(undefined);
            authStore.setLockTTL(undefined);
            authStore.setLockMode(LockMode.NONE);
            authStore.setLocked(false);
            authStore.setUnlockRetryCount(0);

            await auth.persistSession().catch(noop);

            return { mode: LockMode.NONE, locked: false };
        },

        /** Password locking should reset the in-memory `OfflineKD`.
         * Remove the session lock token as well preeventively in case
         * a user ends up in a situation with both a password and an
         * API lock - this should not happen */
        lock: async () => {
            logger.info(`[PasswordLock] locking session`);
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
        unlock: async (secret) => {
            const retryCount = authStore.getUnlockRetryCount() + 1;

            /** API may have been flagged as sessionLocked before
             * booting offline - as such reset the api state to
             * avoid failing subsequent requests. */
            await api.reset();

            try {
                await loadCryptoWorker().catch(() => {
                    throw new PassCryptoError('Could not load worker');
                });

                const offlineConfig = authStore.getOfflineConfig();
                const offlineVerifier = authStore.getOfflineVerifier();

                if (!(offlineConfig && offlineVerifier)) throw new PassCryptoError('Invalid password lock');

                const { salt, params } = offlineConfig;
                const offlineKD = await getOfflineKeyDerivation(secret, stringToUint8Array(salt), params);
                const offlineKey = await getSymmetricKey(offlineKD);

                /** this will throw if the derived offlineKD is incorrect */
                await decryptData(offlineKey, stringToUint8Array(offlineVerifier), PassEncryptionTag.Offline);
                const hash = uint8ArrayToString(offlineKD);
                authStore.setOfflineKD(hash);

                await setRetryCount(0).catch(noop);

                return hash;
            } catch (err) {
                if (err instanceof PassCryptoError) throw err;

                if (retryCount >= 3) {
                    await auth.logout({ soft: false, broadcast: true });
                    throw new Error(c('Warning').t`Too many attempts`);
                }

                await setRetryCount(retryCount).catch(noop);
                await auth.lock(adapter.type, { broadcast: true, soft: true, userInitiated: true });
                const errMessage = authStore.getExtraPassword()
                    ? c('Error').t`Wrong extra password`
                    : c('Error').t`Wrong password`;
                throw Error(errMessage);
            }
        },
    };

    return adapter;
};
