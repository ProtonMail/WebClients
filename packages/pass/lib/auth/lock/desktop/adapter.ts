import { generateKey } from '@protontech/crypto/subtle/aesGcm.ts';

import { binaryStringToUint8Array, uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';
import noop from '@proton/utils/noop';

import { NativeMessageErrorType, PassEncryptionTag } from '../../../../types';
import { asyncLock } from '../../../../utils/fp/promises';
import { logger } from '../../../../utils/logger';
import { getEpoch } from '../../../../utils/time/epoch';
import { decryptData, encryptData, importSymmetricKey } from '../../../crypto/utils/crypto-helpers';
import { NativeMessageError, getNativeMessageErrorKind } from '../../../native-messaging/errors';
import type { NativeMessagingService } from '../../../native-messaging/native-messaging.extension';
import type { AuthService } from '../../service';
import type { LockAdapterDesktop } from '../types';
import { LockMode } from '../types';
import { sendSetupLockSecretMessage, sendUnlockMessage } from './logic.extension';

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

/** Unlock failures are thrown as typed `NativeMessageError`s carrying their
 * `NativeMessageErrorType`. The type travels as data through the request layer and
 * the message broker to the popup, which reconstructs the error and localizes it at
 * the display edge (`useDesktopUnlock`). The request middleware stays quiet for
 * `DESKTOP` (no `withNotification`) so the UI hook owns the single notification — it
 * is the only context that knows whether errors should be silenced (e.g. the inline
 * dropdown has no notification UI). */
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
            const userIdentifier = await sendSetupLockSecretMessage(nativeMessaging, authStore, lockSecret.toBase64());

            /** Setup succeed on desktop side, creating locally */
            await onBeforeCreate?.();

            /** Store verifier + the identifier the secret was keyed under, so unlock reuses
             * the exact same keychain key (see resolveUnlockUserIdentifier) */
            authStore.setDesktopLockVerifier(await encryptVerifier(lockSecret));
            authStore.setDesktopLockUserIdentifier(userIdentifier);
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
            authStore.setDesktopLockUserIdentifier(undefined);
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

        unlock: asyncLock(async () => {
            logger.info(`[DesktopLock] unlocking session`);

            /** Get verifier in session or fail — configuration error, not an auth failure */
            const verifier = authStore.getDesktopLockVerifier();
            if (!verifier) throw new NativeMessageError(NativeMessageErrorType.DESKTOP_LOCK_NOT_CONFIGURED);

            /** Fetch the unlock secret from the desktop app here, in the service worker —
             * this triggers the OS biometric prompt. Doing it here rather than in the popup
             * means the flow survives the popup being torn down while the prompt is in the
             * foreground (which happens on Firefox/Windows — see IDTEAM-5762). The transport
             * (`sendNativeMessageRequest`) owns the request deadline — it rejects with TIMEOUT
             * and disconnects on expiry — so no extra timer is needed here. */
            let authError: NativeMessageError | undefined;

            const secret = await sendUnlockMessage(nativeMessaging, authStore).catch((err: NativeMessageError) => {
                /** Infrastructure errors (timeout / account mismatch): the biometric check
                 * never ran, so surface them without counting a failed attempt. */
                if (getNativeMessageErrorKind(err) !== 'auth') {
                    logger.warn('[DesktopLock] unlock failed (infra)', err.type);
                    throw err;
                }
                authError = err;
                return '';
            });

            const unlockRetryCount = authStore.getUnlockRetryCount() + 1;

            /** Empty secret means the biometric authentication failed */
            if (!secret) {
                logger.warn('[DesktopLock] unlock failed (no secret)', authError?.type);
                if (unlockRetryCount >= 3) {
                    await auth.logout({ soft: false, broadcast: true });
                    throw new NativeMessageError(NativeMessageErrorType.TOO_MANY_ATTEMPTS);
                }

                await auth.syncLock({ unlockRetryCount }).catch(noop);
                await auth.lock(adapter.type, { broadcast: true, soft: true });
                /** Carry the captured auth error, falling back to a meaningful default
                 * for the rare case where the desktop returned an empty secret without error. */
                throw authError ?? new NativeMessageError(NativeMessageErrorType.BIOMETRICS_FAILED);
            }

            /** Check verifier with the given secret or fail */
            const verified = await checkVerifier(secret, verifier).catch(() => false);

            if (!verified) {
                logger.warn('[DesktopLock] unlock failed (secret mismatch)');
                if (unlockRetryCount >= 3) {
                    await auth.logout({ soft: false, broadcast: true });
                    throw new NativeMessageError(NativeMessageErrorType.TOO_MANY_ATTEMPTS);
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
