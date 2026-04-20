import { c } from 'ttag';

import { generateKey } from '@proton/crypto/lib/subtle/aesGcm';
import { sendSetupLockSecretMessage } from '@proton/pass/lib/auth/lock/desktop/logic.extension';
import type { LockAdapterDesktop } from '@proton/pass/lib/auth/lock/types';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { AuthService } from '@proton/pass/lib/auth/service';
import { decryptData, encryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { NativeMessageError } from '@proton/pass/lib/native-messaging/errors';
import type { NativeMessagingService } from '@proton/pass/lib/native-messaging/native-messaging.extension';
import { NativeMessageErrorType, PassEncryptionTag } from '@proton/pass/types';
import { SilentError } from '@proton/pass/utils/errors/errors';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import noop from '@proton/utils/noop';

const encryptVerifier = async (lockSecret: Uint8Array<ArrayBuffer>) => {
    const key = await importSymmetricKey(lockSecret);
    const encryptedVerifier = await encryptData(key, generateKey(), PassEncryptionTag.DesktopUnlockVerifier);
    return uint8ArrayToString(encryptedVerifier);
};

const checkVerifier = async (lockSecret: string, desktopLockVerifier: string) => {
    const key = await importSymmetricKey(Uint8Array.fromBase64(lockSecret));
    await decryptData(key, stringToUint8Array(desktopLockVerifier), PassEncryptionTag.DesktopUnlockVerifier);
    return true;
};

export const desktopLockAdapterFactory = (
    auth: AuthService,
    nativeMessaging: NativeMessagingService
): LockAdapterDesktop => {
    const { authStore, getPersistedSession, onSessionPersist } = auth.config;

    const setRetryCount = async (retryCount: number) => {
        authStore.setUnlockRetryCount(retryCount);
        const localID = authStore.getLocalID();
        const encryptedSession = await getPersistedSession(localID);
        if (encryptedSession) {
            encryptedSession.unlockRetryCount = retryCount;
            await onSessionPersist?.(JSON.stringify(encryptedSession));
        }
    };

    const adapter: LockAdapterDesktop = {
        type: LockMode.DESKTOP,

        check: async () => {
            logger.info(`[DesktopLock] checking desktop lock`);

            authStore.setLockLastExtendTime(getEpoch());
            return { mode: adapter.type, locked: false, ttl: authStore.getLockTTL() };
        },

        create: async (_, ttl, onBeforeCreate) => {
            logger.info(`[DesktopLock] creating desktop lock`);

            /** Create lock secret and send it to desktop app */
            const lockSecret = generateKey();
            await sendSetupLockSecretMessage(nativeMessaging, authStore, lockSecret.toBase64());

            /** Setup succeed on desktop side, creating locally */
            await onBeforeCreate?.();

            /** Store verifier in session */
            authStore.setDesktopLockVerifier(await encryptVerifier(lockSecret));
            authStore.setLockTTL(ttl);
            authStore.setLockLastExtendTime(getEpoch());
            authStore.setLocked(false);
            authStore.setLockMode(adapter.type);
            authStore.setUnlockRetryCount(0);

            await auth.persistSession().catch(noop);

            return { mode: adapter.type, locked: false, ttl };
        },

        delete: async () => {
            logger.info(`[DesktopLock] deleting session lock`);

            authStore.setDesktopLockVerifier(undefined);
            authStore.setLockLastExtendTime(undefined);
            authStore.setLockTTL(undefined);
            authStore.setLockMode(LockMode.NONE);
            authStore.setLocked(false);
            authStore.setUnlockRetryCount(0);

            await auth.persistSession().catch(noop);

            return { mode: LockMode.NONE, locked: false };
        },

        lock: async () => {
            logger.info(`[DesktopLock] locking session`);

            authStore.setLocked(true);

            return { mode: adapter.type, locked: true };
        },

        unlock: async (secret: string) => {
            logger.info(`[DesktopLock] unlocking session`);

            /** Get verifier in session or fail — configuration error, not an auth failure */
            const verifier = authStore.getDesktopLockVerifier();
            if (!verifier) throw new NativeMessageError(NativeMessageErrorType.DESKTOP_LOCK_NOT_CONFIGURED);

            const retryCount = authStore.getUnlockRetryCount() + 1;

            /** Empty secret means the native messaging fetch failed and was already
             * notified to the user — SilentError counts the attempt without a duplicate notification */
            if (!secret) {
                if (retryCount >= 3) {
                    await auth.logout({ soft: false, broadcast: true });
                    throw new Error(c('Warning').t`Too many attempts`);
                }

                await setRetryCount(retryCount).catch(noop);
                await auth.lock(adapter.type, { broadcast: true, soft: true });
                throw new SilentError();
            }

            /** Check verifier with the given secret or fail */
            const verified = await checkVerifier(secret, verifier).catch(() => false);

            if (!verified) {
                if (retryCount >= 3) {
                    await auth.logout({ soft: false, broadcast: true });
                    throw new Error(c('Warning').t`Too many attempts`);
                }

                await setRetryCount(retryCount).catch(noop);
                await auth.lock(adapter.type, { broadcast: true, soft: true });
                throw new NativeMessageError(NativeMessageErrorType.SECRET_MISMATCH);
            }

            authStore.setLocked(false);
            await setRetryCount(0).catch(noop);
            await adapter.check();

            return secret;
        },
    };

    return adapter;
};
