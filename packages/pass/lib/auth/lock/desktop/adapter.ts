import { generateKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { c } from 'ttag';

import { binaryStringToUint8Array, uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';
import noop from '@proton/utils/noop';

import { NativeMessageErrorType, PassEncryptionTag } from '../../../../types';
import { SilentError } from '../../../../utils/errors/errors';
import { asyncLock } from '../../../../utils/fp/promises';
import { logger } from '../../../../utils/logger';
import { getEpoch } from '../../../../utils/time/epoch';
import { decryptData, encryptData, importSymmetricKey } from '../../../crypto/utils/crypto-helpers';
import { NativeMessageError } from '../../../native-messaging/errors';
import type { NativeMessagingService } from '../../../native-messaging/native-messaging.extension';
import type { AuthService } from '../../service';
import type { LockAdapterDesktop } from '../types';
import { LockMode } from '../types';
import { sendSetupLockSecretMessage } from './logic.extension';

const encryptVerifier = async (lockSecret: Uint8Array<ArrayBuffer>) => {
    const key = await importSymmetricKey(lockSecret);
    const encryptedVerifier = await encryptData(key, generateKey(), PassEncryptionTag.DesktopUnlockVerifier);
    return uint8ArrayToBinaryString(encryptedVerifier);
};

const checkVerifier = async (lockSecret: string, desktopLockVerifier: string) => {
    const key = await importSymmetricKey(Uint8Array.fromBase64(lockSecret));
    await decryptData(key, binaryStringToUint8Array(desktopLockVerifier), PassEncryptionTag.DesktopUnlockVerifier);
    return true;
};

export const desktopLockAdapterFactory = (
    auth: AuthService,
    nativeMessaging: NativeMessagingService
): LockAdapterDesktop => {
    const { authStore } = auth.config;

    const adapter: LockAdapterDesktop = {
        type: LockMode.DESKTOP,

        check: async () => {
            logger.info(`[DesktopLock] checking desktop lock`);
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

        unlock: asyncLock(async (secret: string) => {
            logger.info(`[DesktopLock] unlocking session`);

            /** Get verifier in session or fail — configuration error, not an auth failure */
            const verifier = authStore.getDesktopLockVerifier();
            if (!verifier) throw new NativeMessageError(NativeMessageErrorType.DESKTOP_LOCK_NOT_CONFIGURED);

            const unlockRetryCount = authStore.getUnlockRetryCount() + 1;

            /** Empty secret means the native messaging fetch failed and was already
             * notified to the user — SilentError counts the attempt without a duplicate notification */
            if (!secret) {
                if (unlockRetryCount >= 3) {
                    await auth.logout({ soft: false, broadcast: true });
                    throw new Error(c('Warning').t`Too many attempts`);
                }

                await auth.syncLock({ unlockRetryCount }).catch(noop);
                await auth.lock(adapter.type, { broadcast: true, soft: true });
                throw new SilentError();
            }

            /** Check verifier with the given secret or fail */
            const verified = await checkVerifier(secret, verifier).catch(() => false);

            if (!verified) {
                if (unlockRetryCount >= 3) {
                    await auth.logout({ soft: false, broadcast: true });
                    throw new Error(c('Warning').t`Too many attempts`);
                }

                await auth.syncLock({ unlockRetryCount }).catch(noop);
                await auth.lock(adapter.type, { broadcast: true, soft: true });
                throw new NativeMessageError(NativeMessageErrorType.SECRET_MISMATCH);
            }

            authStore.setLocked(false);
            await auth.syncLock({ unlockRetryCount: 0, lockLastExtendTime: getEpoch() }).catch(noop);

            return secret;
        }),
    };

    return adapter;
};
