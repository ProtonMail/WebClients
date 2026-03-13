import { generateKey } from '@proton/crypto/lib/subtle/aesGcm';
import { sendSetupLockSecretMessage } from '@proton/pass/lib/auth/lock/desktop/logic.extension';
import { type LockAdapter, LockMode } from '@proton/pass/lib/auth/lock/types';
import type { AuthService } from '@proton/pass/lib/auth/service';
import { decryptData, encryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import type { NativeMessagingService } from '@proton/pass/lib/native-messaging/native-messaging.extension';
import { PassEncryptionTag } from '@proton/pass/types';
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

export const desktopLockAdapterFactory = (auth: AuthService, nativeMessaging: NativeMessagingService): LockAdapter => {
    const { authStore } = auth.config;

    const adapter: LockAdapter = {
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

            /** Get verifier in session or fail */
            const verifier = authStore.getDesktopLockVerifier();
            if (!verifier) throw new Error('No desktop lock verifier found');

            /** Check verifier with the given secret or fail */
            const verified = await checkVerifier(secret, verifier);
            if (!verified) throw new Error("Received secret doesn't match");

            authStore.setLocked(false);

            return secret;
        },
    };

    return adapter;
};
