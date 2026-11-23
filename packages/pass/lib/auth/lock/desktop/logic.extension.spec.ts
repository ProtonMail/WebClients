import { NativeMessageErrorType, NativeMessageType } from '../../../../types/desktop/extension-unlock-with-desktop';
import { NativeMessageError } from '../../../native-messaging/errors';
import { sendDeleteLockSecretMessage, sendSetupLockSecretMessage, sendUnlockMessage } from './logic.extension';

const MAC_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const WINDOWS_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const self = global as any;
const originalBuildTarget = self.BUILD_TARGET;

const setEnvironment = (buildTarget: string, userAgent: string) => {
    self.BUILD_TARGET = buildTarget;
    vi.stubGlobal('navigator', { userAgent });
};

afterEach(() => {
    vi.unstubAllGlobals();
    self.BUILD_TARGET = originalBuildTarget;
});

const makeNativeMessaging = (response: any) => ({
    sendNativeMessageRequest: vi.fn().mockResolvedValue(response),
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
            sendNativeMessageRequest: vi
                .fn()
                .mockRejectedValue(new NativeMessageError(NativeMessageErrorType.DESKTOP_APP_LOCKED)),
        };

        await expect(
            sendSetupLockSecretMessage(nativeMessaging as any, makeAuthStore() as any, lockSecret)
        ).rejects.toMatchObject({ name: NativeMessageErrorType.DESKTOP_APP_LOCKED });
    });

    test('should wrap unknown errors as UNKNOWN NativeMessageError', async () => {
        const nativeMessaging = {
            sendNativeMessageRequest: vi.fn().mockRejectedValue(new Error('unexpected')),
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

    test('should send a reason completing the macOS prompt sentence', async () => {
        setEnvironment('chrome', MAC_USER_AGENT);
        const nativeMessaging = makeNativeMessaging(unlockResponse);

        await sendUnlockMessage(nativeMessaging as any, makeAuthStore() as any);
        expect(nativeMessaging.sendNativeMessageRequest).toHaveBeenCalledWith(
            expect.objectContaining({ reason: 'unlock the browser extension' })
        );
    });

    test('should send a reason completing the macOS prompt sentence on Safari', async () => {
        setEnvironment('safari', '');
        const nativeMessaging = makeNativeMessaging(unlockResponse);

        await sendUnlockMessage(nativeMessaging as any, makeAuthStore() as any);
        expect(nativeMessaging.sendNativeMessageRequest).toHaveBeenCalledWith(
            expect.objectContaining({ reason: 'unlock the browser extension' })
        );
    });

    test('should send a standalone reason outside macOS and Safari', async () => {
        setEnvironment('chrome', WINDOWS_USER_AGENT);
        const nativeMessaging = makeNativeMessaging(unlockResponse);

        await sendUnlockMessage(nativeMessaging as any, makeAuthStore() as any);
        expect(nativeMessaging.sendNativeMessageRequest).toHaveBeenCalledWith(
            expect.objectContaining({ reason: 'Proton Pass wants to unlock the browser extension' })
        );
    });
});

describe('sendDeleteLockSecretMessage', () => {
    const persistedAuthStore = makeAuthStore('uid-1', 'user-1', 1, 'uid-1-user-1');

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    test('should delete the secret keyed under the persisted identifier', async () => {
        const nativeMessaging = makeNativeMessaging({ type: NativeMessageType.DELETE_LOCK_SECRET });

        await sendDeleteLockSecretMessage(nativeMessaging as any, persistedAuthStore as any);
        expect(nativeMessaging.sendNativeMessageRequest).toHaveBeenCalledWith({
            type: NativeMessageType.DELETE_LOCK_SECRET,
            encrypt: false,
            userIdentifier: 'uid-1-user-1',
        });
    });

    test('should never delete by the legacy identifier, which can collide across browser contexts', async () => {
        const nativeMessaging = makeNativeMessaging({ type: NativeMessageType.DELETE_LOCK_SECRET });

        await sendDeleteLockSecretMessage(
            nativeMessaging as any,
            makeAuthStore('uid-1', 'user-1', 7, undefined) as any
        );
        expect(nativeMessaging.sendNativeMessageRequest).not.toHaveBeenCalled();
    });

    test('should resolve when the native side fails', async () => {
        const nativeMessaging = {
            sendNativeMessageRequest: vi
                .fn()
                .mockRejectedValue(new NativeMessageError(NativeMessageErrorType.HOST_NOT_FOUND)),
        };

        await expect(
            sendDeleteLockSecretMessage(nativeMessaging as any, persistedAuthStore as any)
        ).resolves.toBeUndefined();
    });

    test('should stop waiting on a native side that never answers', async () => {
        const nativeMessaging = { sendNativeMessageRequest: vi.fn().mockReturnValue(new Promise(() => {})) };

        const result = sendDeleteLockSecretMessage(nativeMessaging as any, persistedAuthStore as any);
        vi.advanceTimersByTime(2_000);

        await expect(result).resolves.toBeUndefined();
    });
});
