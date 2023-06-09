import browser from '@proton/pass/globals/browser';
import type {
    ExtensionEndpoint,
    MessageFailure,
    PortFrameForwardingMessage,
    WorkerMessage,
    WorkerMessageWithSender,
    WorkerResponse,
} from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';

/**
 * Wraps the untyped browser.runtime.sendMessage
 * with our message/response types to avoid manually
 * casting the response types every time we use extension
 * messaging
 */
export const sendMessage = async <T extends WorkerMessageWithSender>(
    message: T
): Promise<WorkerResponse<typeof message> | MessageFailure> => {
    try {
        return (await browser.runtime.sendMessage(browser.runtime.id, message)) as WorkerResponse<typeof message>;
    } catch (error: any) {
        return { type: 'error', error };
    }
};

/**
 * Allows mapping over the response type via
 * an onReponse callback instead of manually
 * awaiting the sendMessage response and handling
 * it imperatively
 */
sendMessage.on = async <R, T extends WorkerMessageWithSender>(
    message: T,
    onResponse: (res: WorkerResponse<typeof message> | MessageFailure) => R
): Promise<R> => onResponse(await sendMessage(message));

/**
 * Allows triggering an effect only if the
 * worker response is of type "success"
 */
sendMessage.onSuccess = async <T extends WorkerMessageWithSender>(
    message: T,
    onSuccess: (res: Exclude<WorkerResponse<typeof message>, MessageFailure>) => void
): Promise<void> =>
    sendMessage.on(message, (response) => {
        if (response.type === 'success') {
            onSuccess(response as Exclude<WorkerResponse<typeof message>, MessageFailure>);
        }
    });

export type MessageWithSenderFactory = <T extends WorkerMessage>(message: T) => WorkerMessageWithSender<T>;

export const backgroundMessage: MessageWithSenderFactory = (message) => ({
    ...message,
    sender: 'background',
});

export const popupMessage: MessageWithSenderFactory = (message) => ({
    ...message,
    sender: 'popup',
});

export const contentScriptMessage: MessageWithSenderFactory = (message) => ({
    ...message,
    sender: 'content-script',
});

export const pageMessage: MessageWithSenderFactory = (message) => ({
    ...message,
    sender: 'page',
});

export const portForwardingMessage = <T extends any>(forwardTo: string, payload: T): PortFrameForwardingMessage => ({
    type: WorkerMessageType.PORT_FORWARDING_MESSAGE,
    payload,
    forwardTo,
});

export const resolveMessageFactory = (endpoint: ExtensionEndpoint) => {
    switch (endpoint) {
        case 'background':
            return backgroundMessage;
        case 'popup':
            return popupMessage;
        case 'content-script':
            return contentScriptMessage;
        case 'page':
            return pageMessage;
    }
};
