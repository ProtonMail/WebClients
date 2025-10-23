import { matchExtensionMessage } from 'proton-pass-extension/lib/message/utils';
import type {
    SendTabResponse,
    WorkerMessage,
    WorkerMessageType,
    WorkerMessageWithSender,
} from 'proton-pass-extension/types/messages';
import type { Runtime } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { Maybe } from '@proton/pass/types';
import { eq, not } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';

export type FrameMessageHandler<T extends WorkerMessageType = WorkerMessageType> = (
    message: WorkerMessageWithSender<Extract<WorkerMessage, { type: T }>>,
    sendResponse: SendTabResponse<T>
) => true | void;

export interface FrameMessageBroker {
    register: <T extends WorkerMessageType>(message: T, fn: FrameMessageHandler<T>) => void;
    unregister: <T extends WorkerMessageType>(message: T, fn: FrameMessageHandler<T>) => void;
    destroy: () => void;
}

export const createFrameMessageBroker = (): FrameMessageBroker => {
    const handlers = new Map<WorkerMessageType, FrameMessageHandler<any>[]>();

    const onFrameMessage: Runtime.OnMessageListenerCallback = (message, sender, sendResponse) => {
        if (matchExtensionMessage(message, { sender: 'background' })) {
            let shouldReply: Maybe<true> = undefined;

            handlers.get(message.type)?.forEach((handler) => {
                try {
                    const willReply = handler(message, sendResponse);
                    if (willReply === true) shouldReply = true;
                } catch (err) {
                    logger.error(`[FrameMessageBroker] Failed processing "${message.type}"`, err);
                }
            });

            return shouldReply;
        }

        return undefined as any;
    };

    browser.runtime.onMessage.addListener(onFrameMessage);

    return {
        register: (message, fn) => {
            const current = handlers.get(message) ?? [];
            current.push(fn);
            handlers.set(message, current);
        },

        unregister: (message, fn) => {
            const current = handlers.get(message) ?? [];
            if (!current.length) handlers.delete(message);
            else handlers.set(message, current.filter(not(eq(fn))));
        },

        destroy: () => {
            handlers.clear();
            browser.runtime.onMessage.removeListener(onFrameMessage);
        },
    };
};
