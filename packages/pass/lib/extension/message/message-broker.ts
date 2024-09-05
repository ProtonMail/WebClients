import type { Runtime } from 'webextension-polyfill';

import { assertMessageVersion, backgroundMessage } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import type {
    Maybe,
    MessageFailure,
    MessageSuccess,
    WorkerMessage,
    WorkerMessageResponse,
    WorkerMessageWithSender,
    WorkerResponse,
} from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';
import { notIn } from '@proton/pass/utils/fp/predicates';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { logger } from '@proton/pass/utils/logger';

export const successMessage = <T extends {}>(message?: T) =>
    ({ type: 'success', ...(message ?? {}) }) as MessageSuccess<T>;

export const errorMessage = (error?: string): MessageFailure => ({
    type: 'error',
    error: error ?? 'unknown error',
    payload: error /* needed for Proton Account auth-ext page */,
});

export type MessageHandlerCallback<
    T extends WorkerMessageType = WorkerMessageType,
    M extends WorkerMessageWithSender = Extract<WorkerMessageWithSender, { type: T }>,
> = (message: M, sender: Runtime.MessageSender) => WorkerMessageResponse<T> | Promise<WorkerMessageResponse<T>>;

export type ExtensionMessageBroker = ReturnType<typeof createMessageBroker>;

export const createMessageBroker = (options: {
    allowExternal: WorkerMessageType[];
    strictOriginCheck: WorkerMessageType[];
    onError: (error: any) => void;
    onDisconnect: (portName: string) => void;
}) => {
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

    const onMessage = async (
        message: WorkerMessageWithSender,
        sender: Runtime.MessageSender
    ): Promise<WorkerResponse<WorkerMessageWithSender> | void> => {
        /**
         * During development, while using the webpack dev-server
         * with hot module replacement - we sometimes end up in a
         * "corrupted" state where the service-worker is sending out
         * messages to itself while it is updating or going stale.
         */
        if (process.env.NODE_ENV === 'development') {
            if (message.sender === 'background') {
                browser.runtime.reload();
                return errorMessage();
            }
        }

        const handler = message.type !== undefined ? handlers.get(message.type) : undefined;

        if (handler) {
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
                logger.debug(`[MessageBroker::Message] error`, error);
                options.onError(error);
                return error instanceof Error ? errorMessage(error?.message) : { ...error, type: 'error' };
            }
        }
    };

    const onConnect = (port: Runtime.Port) => {
        ports.set(port.name, port);

        /* If a port forwarding message references a port we have
         * no reference of - reply with a `PORT_UNAUTHORIZED` message
         * on the source port. This can be used in injected frames to
         * detect they're not controlled by a content-script */
        port.onMessage.addListener(async (message: Maybe<WorkerMessageWithSender>, source) => {
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
