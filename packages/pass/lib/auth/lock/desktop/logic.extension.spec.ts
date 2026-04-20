import { sendSetupLockSecretMessage } from '@proton/pass/lib/auth/lock/desktop/logic.extension';
import { NativeMessageError } from '@proton/pass/lib/native-messaging/errors';
import { NativeMessageErrorType, NativeMessageType } from '@proton/pass/types';

const makeNativeMessaging = (response: any) => ({
    sendNativeMessageRequest: jest.fn().mockResolvedValue(response),
});

const makeAuthStore = (localID = 1, userID = 'user-1') => ({
    getLocalID: () => localID,
    getUserID: () => userID,
});

const lockSecret = 'test-secret';
const userIdentifier = '1-user-1';
const validResponse = { type: NativeMessageType.SETUP_LOCK_SECRET, lockSecret, userIdentifier };

describe('sendSetupLockSecretMessage', () => {
    test('should resolve when the response matches the request', async () => {
        const nativeMessaging = makeNativeMessaging(validResponse);
        await expect(
            sendSetupLockSecretMessage(nativeMessaging as any, makeAuthStore() as any, lockSecret)
        ).resolves.toBeUndefined();
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
});
