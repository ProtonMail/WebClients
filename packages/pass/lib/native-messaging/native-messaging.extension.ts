import type { Runtime } from 'webextension-polyfill';

import { PASS_DESKTOP_NATIVE_MESSAGE_KEY, PASS_DESKTOP_NATIVE_MESSAGE_TIMEOUT } from '@proton/pass/constants';
import browser from '@proton/pass/lib/globals/browser';
import { messageToPayload, payloadToMessage } from '@proton/pass/lib/native-messaging/crypto';
import {
    NativeMessageError,
    getForNativeMessageErrorFromConnectionError,
} from '@proton/pass/lib/native-messaging/errors';
import { NativeMessageErrorType } from '@proton/pass/types';
import type {
    MaybeNull,
    NativeMessage,
    NativeMessagePayload,
    NativeMessageRequest,
    NativeMessageResponseForRequest,
    SendNativeMessageRequest,
} from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

const log = (...content: any[]) => logger.debug('[NativeMessaging]', ...content);

export type NativeMessagingService = {
    sendNativeMessageRequest: SendNativeMessageRequest;
};

type PendingRequests = Map<
    string,
    {
        resolve: <Req extends NativeMessageRequest>(value: NativeMessageResponseForRequest<Req>) => void;
        reject: (error: NativeMessageError) => void;
    }
>;

export const createNativeMessagingService = (): NativeMessagingService => {
    let port: MaybeNull<Runtime.Port> = null;
    const pendingRequests: PendingRequests = new Map();

    const onDisconnect = (disconnectedPort: Runtime.Port) => {
        port = null;
        const error = new NativeMessageError(
            getForNativeMessageErrorFromConnectionError(disconnectedPort.error, browser.runtime.lastError)
        );
        pendingRequests.forEach((req) => req.reject(error));
        pendingRequests.clear();
        log('Disconnected', error);
    };

    const onMessage = async (rawResponse: unknown) => {
        try {
            const responsePayload = (
                typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse
            ) as NativeMessagePayload<NativeMessage>;

            const pending = pendingRequests.get(responsePayload.messageId);
            if (pending === undefined) {
                log('Unknown response messageId', responsePayload.messageId);
                return;
            }

            try {
                if ('error' in responsePayload) {
                    throw new NativeMessageError(responsePayload.error as NativeMessageErrorType);
                }

                const response = await payloadToMessage(responsePayload, 'desktop');

                log('Received response');
                pending.resolve(response as NativeMessageResponseForRequest<NativeMessageRequest>);
            } catch (error) {
                log('Received response error', { responsePayload, error });
                pending.reject(error as NativeMessageError);
            }
        } catch (error) {
            log('onMessage unknown error', error);
        }
    };

    const connect = () => {
        if (port !== null) {
            return port;
        }

        try {
            if (!browser.runtime.connectNative) {
                throw new Error('Missing Native messaging permission');
            }

            port = browser.runtime.connectNative(PASS_DESKTOP_NATIVE_MESSAGE_KEY);
            port.onDisconnect.addListener(onDisconnect);
            port.onMessage.addListener(onMessage);

            return port;
        } catch (error) {
            log('Connect native error', error);
            throw error;
        }
    };

    const sendRequest = async <Req extends NativeMessageRequest>(
        port: Runtime.Port,
        request: Req,
        messageId: string
    ) => {
        const requestPayload = await messageToPayload(request, messageId, 'extension');

        log('Sending request');

        port.postMessage(requestPayload);
    };

    const sendNativeMessageRequest: SendNativeMessageRequest = async <Req extends NativeMessageRequest>(request: Req) =>
        new Promise<NativeMessageResponseForRequest<Req>>(async (resolve, reject) => {
            const messageId = uniqueId();
            const timeoutId = setTimeout(() => {
                pendingRequests.delete(messageId);
                reject(new NativeMessageError(NativeMessageErrorType.TIMEOUT));
            }, PASS_DESKTOP_NATIVE_MESSAGE_TIMEOUT);

            const settle = (fn: () => void) => {
                clearTimeout(timeoutId);
                pendingRequests.delete(messageId);
                fn();
            };

            pendingRequests.set(messageId, {
                resolve: (value) => settle(() => resolve(value)),
                reject: (err) => settle(() => reject(err)),
            });

            await sendRequest(connect(), request, messageId);
        });

    return { sendNativeMessageRequest };
};
