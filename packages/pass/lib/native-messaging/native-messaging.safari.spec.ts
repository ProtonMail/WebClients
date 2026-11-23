import type { Mock } from 'vitest';

import { PASS_DESKTOP_NATIVE_MESSAGE_TIMEOUT, SAFARI_MESSAGE_KEY } from '../../constants';
import { NativeMessageErrorType, NativeMessageType } from '../../types/desktop/extension-unlock-with-desktop';
import browser from '../globals/browser';
import { createSafariNativeMessagingService } from './native-messaging.safari';

vi.mock('../globals/browser', () => ({
    __esModule: true,
    default: { runtime: { sendNativeMessage: vi.fn() } },
}));

const sendNativeMessage = browser.runtime.sendNativeMessage as Mock;

describe('createSafariNativeMessagingService', () => {
    const { sendNativeMessageRequest } = createSafariNativeMessagingService();

    beforeEach(() => {
        sendNativeMessage.mockReset();
    });
    afterEach(() => vi.useRealTimers());

    test('should send the setup request in cleartext under the `biometricLock` key', async () => {
        sendNativeMessage.mockResolvedValue(JSON.stringify({ userIdentifier: 'uid-user', lockSecret: 'secret' }));

        const response = await sendNativeMessageRequest({
            type: NativeMessageType.SETUP_LOCK_SECRET,
            encrypt: true,
            lockSecret: 'secret',
            userIdentifier: 'uid-user',
        });

        expect(sendNativeMessage).toHaveBeenCalledWith(
            SAFARI_MESSAGE_KEY,
            JSON.stringify({
                biometricLock: {
                    type: NativeMessageType.SETUP_LOCK_SECRET,
                    lockSecret: 'secret',
                    userIdentifier: 'uid-user',
                },
            })
        );
        expect(response).toEqual({
            type: NativeMessageType.SETUP_LOCK_SECRET,
            encrypt: true,
            lockSecret: 'secret',
            userIdentifier: 'uid-user',
        });
    });

    test('should resolve the unlock secret', async () => {
        sendNativeMessage.mockResolvedValue(JSON.stringify({ secret: 'c2VjcmV0' }));

        const response = await sendNativeMessageRequest({
            type: NativeMessageType.UNLOCK,
            encrypt: false,
            userIdentifier: 'uid-user',
            reason: 'unlock the browser extension',
        });

        expect(response).toEqual({ type: NativeMessageType.UNLOCK, encrypt: false, secret: 'c2VjcmV0' });
    });

    test('should reject with the error type returned by the app extension', async () => {
        sendNativeMessage.mockResolvedValue(JSON.stringify({ error: NativeMessageErrorType.BIOMETRICS_FAILED }));

        await expect(
            sendNativeMessageRequest({
                type: NativeMessageType.UNLOCK,
                encrypt: false,
                userIdentifier: 'uid-user',
                reason: '',
            })
        ).rejects.toMatchObject({ type: NativeMessageErrorType.BIOMETRICS_FAILED });
    });

    test('should reject with UNKNOWN on an empty response', async () => {
        sendNativeMessage.mockResolvedValue(undefined);

        await expect(
            sendNativeMessageRequest({
                type: NativeMessageType.DELETE_LOCK_SECRET,
                encrypt: false,
                userIdentifier: 'uid-user',
            })
        ).rejects.toMatchObject({ type: NativeMessageErrorType.UNKNOWN });
    });

    test('should reject with HOST_NOT_RESPONDING when Safari fails to deliver the message', async () => {
        sendNativeMessage.mockRejectedValue(new Error('native bridge failure'));

        await expect(
            sendNativeMessageRequest({
                type: NativeMessageType.DELETE_LOCK_SECRET,
                encrypt: false,
                userIdentifier: 'uid-user',
            })
        ).rejects.toMatchObject({ type: NativeMessageErrorType.HOST_NOT_RESPONDING });
    });

    test('should reject with TIMEOUT when the app extension never answers', async () => {
        vi.useFakeTimers();
        sendNativeMessage.mockReturnValue(new Promise(() => {}));

        const response = sendNativeMessageRequest({
            type: NativeMessageType.UNLOCK,
            encrypt: false,
            userIdentifier: 'uid-user',
            reason: '',
        });
        vi.advanceTimersByTime(PASS_DESKTOP_NATIVE_MESSAGE_TIMEOUT);

        await expect(response).rejects.toMatchObject({ type: NativeMessageErrorType.TIMEOUT });
    });
});
