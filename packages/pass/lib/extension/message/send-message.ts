import browser from '@proton/pass/lib/globals/browser';
import type {
    ClientEndpoint,
    MessageFailure,
    PortFrameForwardingMessage,
    WorkerMessage,
    WorkerMessageWithSender,
    WorkerResponse,
} from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';

export class MessageVersionMismatchError extends Error {
    name = 'MessageVersionMismatchError';

    message = 'Extension version mismatch';
}

export class CriticalMessageResponseError extends Error {
    name = 'CriticalMessageResponseError';

    message = 'Worker failed to respond';
}

export type MessageWithSenderFactory = <T extends WorkerMessage>(message: T) => WorkerMessageWithSender<T>;

/** This function is essential for maintaining consistent communication between
 * extension components, ensuring they all use the correct app version. It
 * prevents potential discrepancies that can occur during an extension update,
 * where components like the service worker, popup, and content scripts may differ
 * due to the unique way service workers are updated in MV3. */
export const assertMessageVersion = (message: WorkerMessageWithSender) => {
    if (message.version !== VERSION) throw new MessageVersionMismatchError();
};

/** Wraps the untyped `browser.runtime.sendMessage` with our message/response types
 * to avoid manually casting the response types every time we use extension messaging.
 * NOTE: if message response is undefined - which can happen if the service-worker is
 * in a corrupted state - flag the error as being critical so as to reload the runtime. */
export const sendMessage = async <T extends WorkerMessageWithSender>(
    message: T
): Promise<WorkerResponse<T> | MessageFailure> => {
    try {
        const res = await browser.runtime.sendMessage(browser.runtime.id, message);
        if (res === undefined) throw new CriticalMessageResponseError();
        return res;
    } catch (error) {
        return {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            critical: error instanceof CriticalMessageResponseError,
        };
    }
};

/** Allows mapping over the response type via an `onReponse` callback instead of
 * manually awaiting the `sendMessage` response and handling it imperatively */
sendMessage.on = async <R, T extends WorkerMessageWithSender>(
    message: T,
    onResponse: (res: WorkerResponse<T> | MessageFailure) => R
): Promise<R> => onResponse(await sendMessage(message));

/* Allows triggering an effect only if the worker response is of type "success" */
sendMessage.onSuccess = async <T extends WorkerMessageWithSender>(
    message: T,
    onSuccess: (res: Exclude<WorkerResponse<T>, MessageFailure>) => void
): Promise<void> =>
    sendMessage.on(message, (response) => {
        if (response.type === 'success') {
            onSuccess(response as Exclude<WorkerResponse<typeof message>, MessageFailure>);
        }
    });

export const resolveMessageFactory =
    (sender: ClientEndpoint): MessageWithSenderFactory =>
    (message) => ({
        ...message,
        sender,
        version: VERSION,
    });

export const backgroundMessage = resolveMessageFactory('background');
export const popupMessage = resolveMessageFactory('popup');
export const pageMessage = resolveMessageFactory('page');
export const contentScriptMessage = resolveMessageFactory('contentscript');

export const portForwardingMessage = <T extends { sender: ClientEndpoint }>(
    forwardTo: string,
    payload: T
): WorkerMessageWithSender<PortFrameForwardingMessage> => ({
    forwardTo,
    payload,
    sender: payload.sender,
    type: WorkerMessageType.PORT_FORWARDING_MESSAGE,
    version: VERSION,
});
