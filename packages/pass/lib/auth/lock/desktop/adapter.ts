import { generateKey } from '@protontech/crypto/subtle/aesGcm.ts';

import { binaryStringToUint8Array, uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';
import noop from '@proton/utils/noop';

import { PassEncryptionTag } from '../../../../types/crypto/pass-types';
import { NativeMessageErrorType } from '../../../../types/desktop/extension-unlock-with-desktop';
import type { Maybe } from '../../../../types/utils';
import { asyncLock } from '../../../../utils/fp/promises';
import { logger } from '../../../../utils/logger';
import { getEpoch } from '../../../../utils/time/epoch';
import { decryptData, encryptData, importSymmetricKey } from '../../../crypto/utils/crypto-helpers';
import { NativeMessageError, getNativeMessageErrorKind } from '../../../native-messaging/errors';
import type { NativeMessagingService } from '../../../native-messaging/native-messaging.extension';
import type { AuthService } from '../../service';
import type { LockAdapterDesktop } from '../types';
import { LockMode } from '../types';
import { sendDeleteLockSecretMessage, sendSetupLockSecretMessage, sendUnlockMessage } from './logic.extension';

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
    nativeMessaging: NativeMessagingService,
    onDeclined: () => void
): LockAdapterDesktop => {
    const { authStore } = auth.config;

    /** Create lock secret and send it to desktop app */
    const setupLockSecret = async () => {
        const lockSecret = generateKey();
        const userIdentifier = await sendSetupLockSecretMessage(nativeMessaging, authStore, lockSecret.toBase64());
        return { verifier: await encryptVerifier(lockSecret), userIdentifier };
    };

    /** Counts a failed biometric attempt: logs out on the 3rd, re-locks otherwise */
    const failUnlockAttempt = async (error: NativeMessageError): Promise<never> => {
        const unlockRetryCount = authStore.getUnlockRetryCount() + 1;

        if (unlockRetryCount >= 3) {
            await auth.logout({ soft: false, broadcast: true });
            throw new NativeMessageError(NativeMessageErrorType.TOO_MANY_ATTEMPTS);
        }

        await auth.syncLock({ unlockRetryCount }).catch(noop);
        await auth.lock(LockMode.DESKTOP, { broadcast: true, soft: true });
        throw error;
    };

    /** Empty secret means the biometric authentication failed */
    const verifyLockSecret = async (secret: Maybe<string>, verifier: string) => {
        if (!secret) {
            logger.warn('[DesktopLock] unlock failed (no secret)');
            /** Rare: the desktop returned an empty secret without error */
            return failUnlockAttempt(new NativeMessageError(NativeMessageErrorType.BIOMETRICS_FAILED));
        }

        const verified = await checkVerifier(secret, verifier).catch(() => false);

        if (!verified) {
            logger.warn('[DesktopLock] unlock failed (secret mismatch)');
            return failUnlockAttempt(new NativeMessageError(NativeMessageErrorType.SECRET_MISMATCH));
        }
    };

    const adapter: LockAdapterDesktop = {
        type: LockMode.DESKTOP,

        check: async () => {
            logger.info(`[DesktopLock] checking desktop lock`);
            return { mode: adapter.type, locked: false, ttl: authStore.getLockTTL() };
        },

        create: async (_, ttl, onBeforeCreate) => {
            logger.info(`[DesktopLock] creating desktop lock`);

            const lockSecretSetup = nativeMessaging.trusted ? null : await setupLockSecret();

            /** Setup succeed on desktop side, creating locally */
            await onBeforeCreate?.();

            /** Store verifier + the identifier the secret was keyed under, so unlock reuses
             * the exact same keychain key (see resolveUnlockUserIdentifier) */
            authStore.setDesktopLockVerifier(lockSecretSetup?.verifier);
            authStore.setDesktopLockUserIdentifier(lockSecretSetup?.userIdentifier);
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

            await sendDeleteLockSecretMessage(nativeMessaging, authStore);

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

        onLogout: () => sendDeleteLockSecretMessage(nativeMessaging, authStore),

        unlock: asyncLock(async () => {
            logger.info(`[DesktopLock] unlocking session`);

            /** Get verifier in session or fail — configuration error, not an auth failure.
             * A trusted transport has none: its unlock answer is enough. */
            const verifier = authStore.getDesktopLockVerifier();
            if (!verifier && !nativeMessaging.trusted) {
                throw new NativeMessageError(NativeMessageErrorType.DESKTOP_LOCK_NOT_CONFIGURED);
            }

            /** Fetch the unlock secret from the desktop app here, in the service worker —
             * this triggers the OS biometric prompt. Doing it here rather than in the popup
             * means the flow survives the popup being torn down while the prompt is in the
             * foreground (which happens on Firefox/Windows — see IDTEAM-5762). The transport
             * (`sendNativeMessageRequest`) owns the request deadline — it rejects with TIMEOUT
             * and disconnects on expiry — so no extra timer is needed here. */
            const secret = await sendUnlockMessage(nativeMessaging, authStore).catch((err: NativeMessageError) => {
                const kind = getNativeMessageErrorKind(err);

                /** The user dismissed the prompt: not a failed attempt, the session stays locked
                 * and clients stop auto-prompting until the user asks again. */
                if (kind === 'cancel') {
                    logger.info('[DesktopLock] unlock cancelled');
                    onDeclined();
                    throw err;
                }

                /** Infrastructure errors (timeout / account mismatch): the biometric check
                 * never ran, so surface them without counting a failed attempt. */
                if (kind !== 'auth') {
                    logger.warn('[DesktopLock] unlock failed (infra)', err.type);
                    throw err;
                }

                logger.warn('[DesktopLock] unlock failed (auth)', err.type);
                return failUnlockAttempt(err);
            });

            if (verifier) await verifyLockSecret(secret, verifier);

            authStore.setLocked(false);
            await auth.syncLock({ unlockRetryCount: 0, lockLastExtendTime: getEpoch() }).catch(noop);

            return secret;
        }),
    };

    return adapter;
};
