import noop from '@proton/utils/noop';

import { PASS_DESKTOP_NATIVE_MESSAGE_TIMEOUT, SAFARI_MESSAGE_KEY } from '../../constants';
import type {
    NativeMessageRequest,
    NativeMessageResponseForRequest,
    SendNativeMessageRequest,
} from '../../types/desktop/extension-unlock-with-desktop';
import { NativeMessageErrorType } from '../../types/desktop/extension-unlock-with-desktop';
import { logger } from '../../utils/logger';
import browser from '../globals/browser';
import { NativeMessageError } from './errors';
import type { NativeMessagingService } from './native-messaging.extension';

const info = (...content: any[]) => logger.info('[NativeMessaging::Safari]', ...content);

type SafariNativeResponse = Record<string, string>;

/** Safari never times out the native bridge on its own */
const sendWithTimeout = (message: string) =>
    new Promise<unknown>((resolve, reject) => {
        const timeoutId = setTimeout(
            () => reject(new NativeMessageError(NativeMessageErrorType.TIMEOUT)),
            PASS_DESKTOP_NATIVE_MESSAGE_TIMEOUT
        );

        browser.runtime
            .sendNativeMessage(SAFARI_MESSAGE_KEY, message)
            .then(resolve, () => reject(new NativeMessageError(NativeMessageErrorType.HOST_NOT_RESPONDING)))
            .finally(() => clearTimeout(timeoutId));
    });

const parseResponse = (raw: unknown): SafariNativeResponse => {
    try {
        if (typeof raw !== 'string') throw new Error('Empty native response');
        return JSON.parse(raw);
    } catch {
        throw new NativeMessageError(NativeMessageErrorType.UNKNOWN);
    }
};

/** Safari only routes `sendNativeMessage` to the app extension shipped in the same signed
 * bundle: there is no replaceable host relaying the messages, so they travel without the
 * encrypted envelope the desktop transport needs. The app extension answers every lock
 * request itself, without the desktop app. */
export const createSafariNativeMessagingService = (): NativeMessagingService => {
    const sendNativeMessageRequest: SendNativeMessageRequest = async <Req extends NativeMessageRequest>(
        request: Req
    ) => {
        const { encrypt, ...biometricLock } = request;

        info('Sending request', request.type);
        const response = parseResponse(await sendWithTimeout(JSON.stringify({ biometricLock })));

        if ('error' in response) {
            info('Received response error', response.error);
            throw new NativeMessageError(response.error as NativeMessageErrorType);
        }

        return { ...response, type: request.type, encrypt } as NativeMessageResponseForRequest<Req>;
    };

    return { sendNativeMessageRequest, disconnect: noop, trusted: true };
};
