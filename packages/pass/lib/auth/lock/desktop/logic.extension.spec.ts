import { NativeMessageErrorType, NativeMessageType } from '../../../../types';
import { NativeMessageError } from '../../../native-messaging/errors';
import { sendSetupLockSecretMessage, sendUnlockMessage } from './logic.extension';

const makeNativeMessaging = (response: any) => ({
    sendNativeMessageRequest: jest.fn().mockResolvedValue(response),
});

const makeAuthStore = (uid = 'uid-1', userID = 'user-1', localID = 1, desktopLockUserIdentifier?: string) => ({
    getUID: () => uid,
    getLocalID: () => localID,
    getUserID: () => userID,
    getDesktopLockUserIdentifier: () => desktopLockUserIdentifier,
});

const lockSecret = 'test-secret';
const userIdentifier = 'uid-1-user-1';
const validResponse = { type: NativeMessageType.SETUP_LOCK_SECRET, lockSecret, userIdentifier };

describe('sendSetupLockSecretMessage', () => {
    test('should resolve with the identifier the secret was keyed under', async () => {
        const nativeMessaging = makeNativeMessaging(validResponse);
        await expect(
            sendSetupLockSecretMessage(nativeMessaging as any, makeAuthStore() as any, lockSecret)
        ).resolves.toBe(userIdentifier);
    });

    test('should throw SETUP_LOCK_SECRET_INVALID_RESPONSE if lockSecret in response does not match', async () => {
        const nativeMessaging = makeNativeMessaging({ ...validResponse, lockSecret: 'other-secret' });

        await expect(
            sendSetupLockSecretMessage(nativeMessaging as any, makeAuthStore() as any, lockSecret)
        ).rejects.toMatchObject({ name: NativeMessageErrorType.SETUP_LOCK_SECRET_INVALID_RESPONSE });
    });

    test('should throw ACCOUNT_MISMATCH if userIdentifier in response does not match', async () => {
        const nativeMessaging = makeNativeMessaging({ ...validResponse, userIdentifier: 'other-user' });

        await expect(
            sendSetupLockSecretMessage(nativeMessaging as any, makeAuthStore() as any, lockSecret)
        ).rejects.toMatchObject({ name: NativeMessageErrorType.ACCOUNT_MISMATCH });
    });

    test('should propagate DESKTOP_APP_LOCKED as a NativeMessageError without wrapping it', async () => {
        const nativeMessaging = {
            sendNativeMessageRequest: jest
                .fn()
                .mockRejectedValue(new NativeMessageError(NativeMessageErrorType.DESKTOP_APP_LOCKED)),
        };

        await expect(
            sendSetupLockSecretMessage(nativeMessaging as any, makeAuthStore() as any, lockSecret)
        ).rejects.toMatchObject({ name: NativeMessageErrorType.DESKTOP_APP_LOCKED });
    });

    test('should wrap unknown errors as UNKNOWN NativeMessageError', async () => {
        const nativeMessaging = {
            sendNativeMessageRequest: jest.fn().mockRejectedValue(new Error('unexpected')),
        };

        await expect(
            sendSetupLockSecretMessage(nativeMessaging as any, makeAuthStore() as any, lockSecret)
        ).rejects.toMatchObject({ name: NativeMessageErrorType.UNKNOWN });
    });

    test('should request the secret keyed under the session UID', async () => {
        const nativeMessaging = makeNativeMessaging(validResponse);
        await sendSetupLockSecretMessage(nativeMessaging as any, makeAuthStore() as any, lockSecret);
        expect(nativeMessaging.sendNativeMessageRequest).toHaveBeenCalledWith(
            expect.objectContaining({ type: NativeMessageType.SETUP_LOCK_SECRET, userIdentifier })
        );
    });
});

describe('sendUnlockMessage', () => {
    const secret = 'unlock-secret';
    const unlockResponse = { type: NativeMessageType.UNLOCK, secret };

    test('should unlock using the persisted identifier when present', async () => {
        const nativeMessaging = makeNativeMessaging(unlockResponse);
        const authStore = makeAuthStore('uid-1', 'user-1', 1, 'uid-1-user-1');

        await expect(sendUnlockMessage(nativeMessaging as any, authStore as any)).resolves.toBe(secret);
        expect(nativeMessaging.sendNativeMessageRequest).toHaveBeenCalledWith(
            expect.objectContaining({ type: NativeMessageType.UNLOCK, userIdentifier: 'uid-1-user-1' })
        );
    });

    test('should fall back to the legacy localID identifier for pre-migration locks', async () => {
        const nativeMessaging = makeNativeMessaging(unlockResponse);
        const authStore = makeAuthStore('uid-1', 'user-1', 7, undefined);

        await expect(sendUnlockMessage(nativeMessaging as any, authStore as any)).resolves.toBe(secret);
        expect(nativeMessaging.sendNativeMessageRequest).toHaveBeenCalledWith(
            expect.objectContaining({ type: NativeMessageType.UNLOCK, userIdentifier: '7-user-1' })
        );
    });
});
