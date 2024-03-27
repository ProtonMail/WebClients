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

const VersionMismatchError = () => {
    const error = new Error();
    error.message = 'Extension version mismatch';
    error.name = 'VersionMismatch';
    return error;
};

/**
 * This function is essential for maintaining consistent communication between
 * extension components, ensuring they all use the correct app version. It
 * prevents potential discrepancies that can occur during an extension update,
 * where components like the service worker, popup, and content scripts may differ
 * due to the unique way service workers are updated in MV3.
 */
export const assertMessageVersion = (message: WorkerMessageWithSender) => {
    if (message.version !== VERSION) throw VersionMismatchError();
};

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
        return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
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

const messageCreator =
    (sender: ClientEndpoint): MessageWithSenderFactory =>
    (message) => ({
        ...message,
        sender,
        version: VERSION,
    });

export const backgroundMessage = messageCreator('background');
export const popupMessage = messageCreator('popup');
export const pageMessage = messageCreator('page');
export const contentScriptMessage = messageCreator('contentscript');

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

export const resolveMessageFactory = messageCreator;
