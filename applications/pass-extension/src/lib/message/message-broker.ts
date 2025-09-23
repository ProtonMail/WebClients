import type {
    WorkerMessage,
    WorkerMessageResponse,
    WorkerMessageWithSender,
    WorkerResponse,
} from 'proton-pass-extension/types/messages';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { Runtime } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { Maybe } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';
import { notIn } from '@proton/pass/utils/fp/predicates';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { logger } from '@proton/pass/utils/logger';

import { assertMessageVersion, backgroundMessage, errorMessage, successMessage } from './send-message';
import { isExtensionMessage } from './utils';

export type MessageHandlerCallback<
    T extends WorkerMessageType = WorkerMessageType,
    M extends WorkerMessageWithSender = Extract<WorkerMessageWithSender, { type: T }>,
> = (message: M, sender: Runtime.MessageSender) => WorkerMessageResponse<T> | Promise<WorkerMessageResponse<T>>;

export type ExtensionMessageBroker = ReturnType<typeof createMessageBroker>;

type MessageBrokerOptions = {
    /** Allowed messages for externally connectable websites. */
    allowExternal: WorkerMessageType[];
    strictOriginCheck: WorkerMessageType[];
    /** Filter function to determine if a message should be processed by this broker.
     * Returns true to accept and process the message, false to reject it.
     * This is essential for preventing multiple extension contexts (service worker,
     * offscreen document, popup, etc.) from handling the same message and causing
     * conflicts or duplicate responses. Each context should implement appropriate
     * sender-based filtering to ensure only the intended recipient processes messages. */
    onAccept: (message: WorkerMessageWithSender) => boolean;
    onDisconnect: (portName: string) => void;
    onError: (error: any) => void;
};

export const createMessageBroker = (options: MessageBrokerOptions) => {
    const handlers: Map<WorkerMessageType, MessageHandlerCallback> = new Map();
    const ports: Map<string, Runtime.Port> = new Map();
    const buffer: Set<WorkerMessageWithSender> = new Set();
    const extensionOrigin = safeCall(() => new URL(browser.runtime.getURL('/')).origin)();

    const broadcast = <M extends WorkerMessage>(message: M, matchPort?: string | ((name: string) => boolean)) => {
        ports.forEach(
            (port) =>
                (matchPort === undefined ||
                    (typeof matchPort === 'string' && port.name === matchPort) ||
                    (typeof matchPort === 'function' && matchPort(port.name))) &&
                port.postMessage(backgroundMessage(message))
        );
    };

    const query = (match: (key: string) => boolean) =>
        Array.from(ports)
            .filter(([key]) => match(key))
            .map(([, port]) => port);

    const registerMessage = <T extends WorkerMessageType>(message: T, handler: MessageHandlerCallback<T>) => {
        if (handlers.has(message)) {
            throw new Error(`Message handler for "${message}" already registered`);
        }

        handlers.set(message, handler as MessageHandlerCallback<any>);
    };

    const onExtensionMessage = async (
        message: WorkerMessageWithSender,
        sender: Runtime.MessageSender,
        handler: MessageHandlerCallback
    ): Promise<WorkerResponse<WorkerMessageWithSender>> => {
        try {
            const isExternal = sender.id !== browser.runtime.id;
            const isInternal = !isExternal;

            if (isExternal && notIn(options.allowExternal)(message.type)) {
                logger.warn('[MessageBroker::Message] unauthorized external message');
                return errorMessage('unauthorized');
            }

            if (isInternal) assertMessageVersion(message);

            if (BUILD_TARGET !== 'safari' && isInternal && options.strictOriginCheck.includes(message.type)) {
                const origin = new URL((sender as any).origin ?? sender.url).origin;
                if (origin !== extensionOrigin) {
                    logger.warn('[MessageBroker::Message] unauthorized message origin');
                    return errorMessage('unauthorized');
                }
            }

            const res = await handler(message, sender);

            if (typeof res === 'boolean' || res === undefined) {
                if (res === false) throw new Error(`Error when processing "${message.type}"`);
                return successMessage({});
            }

            return successMessage(res);
        } catch (error: any) {
            logger.debug(`[MessageBroker::Message] Error "${message.type}"`, error);
            options.onError(error);
            return error instanceof Error ? errorMessage(error?.message) : { ...error, type: 'error' };
        }
    };

    const onMessage = (
        message: unknown,
        sender: Runtime.MessageSender
    ): Maybe<Promise<WorkerResponse<WorkerMessageWithSender>>> => {
        if (isExtensionMessage(message)) {
            /** Check if this message broker should accept and process the message.
             * This prevents multiple extension contexts from handling the same message. */
            if (!options.onAccept(message)) {
                logger.warn(`[MessageBroker] Message "${message.type}" rejected from sender: ${message.sender}`);
                return;
            }

            const handler = message.type !== undefined ? handlers.get(message.type) : undefined;
            if (handler) return onExtensionMessage(message, sender, handler);
        }
    };

    const onConnect = (port: Runtime.Port) => {
        ports.set(port.name, port);

        /* If a port forwarding message references a port we have
         * no reference of - reply with a `PORT_UNAUTHORIZED` message
         * on the source port. This can be used in injected frames to
         * detect they're not controlled by a content-script */
        port.onMessage.addListener((message: unknown, source) => {
            if (isExtensionMessage(message)) {
                try {
                    if (message) assertMessageVersion(message);
                    if (message && message.type === WorkerMessageType.PORT_FORWARDING_MESSAGE) {
                        if (ports.has(message.forwardTo)) {
                            ports.get(message.forwardTo)!.postMessage({ ...message.payload, forwarded: true });
                        } else {
                            source.postMessage(backgroundMessage({ type: WorkerMessageType.PORT_UNAUTHORIZED }));
                        }
                    }
                } catch (err: unknown) {
                    options.onError(err);
                    throw err;
                }
            }
        });

        port.onDisconnect.addListener(({ name }) => {
            /** Handle port disconnection and potential BFCache-related errors.
             * Chrome 123+ introduced changes to extension messaging with BFCache.
             * These changes may trigger runtime errors, but they're generally
             * safe to ignore as we're already handling page lifecycle events in
             * the content script. We explicitly access chrome.runtime.lastError
             * to prevent unhandled error logs.
             * see: https://developer.chrome.com/blog/bfcache-extension-messaging-changes */
            void browser.runtime.lastError;
            ports.delete(name);
            options.onDisconnect(name);
        });
    };

    const disconnect = () => ports.forEach((port) => port.disconnect());

    return {
        registerMessage,
        onMessage,
        buffer: {
            push: (message: WorkerMessageWithSender) => buffer.add(message),
            flush: pipe(
                () => Array.from(buffer.values()),
                tap(() => buffer.clear())
            ),
        },
        ports: {
            broadcast,
            onConnect,
            disconnect,
            query,
        },
    };
};
