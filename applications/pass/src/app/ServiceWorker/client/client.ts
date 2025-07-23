import { SW_CLIENT_CHANNEL } from 'proton-pass-web/app/ServiceWorker/constants';
import type {
    ServiceWorkerMessage,
    ServiceWorkerMessageType,
    ServiceWorkerResponse,
    WithOrigin,
} from 'proton-pass-web/app/ServiceWorker/types';
import config from 'proton-pass-web/app/config';

import { logger } from '@proton/pass/utils/logger';

import { registerServiceWorker } from './register';

export type ServiceWorkerClientMessageHandler<T extends ServiceWorkerMessageType = any> = (
    message: Extract<ServiceWorkerMessage, { type: T }>
) => void;

export interface ServiceWorkerClient {
    register: (options: { onUpdateAvailable: () => void }) => Promise<void>;
    listen: () => () => void;
    /** sends a unidirectional message to the service worker. */
    send: (message: ServiceWorkerMessage, transfer?: Transferable[]) => void;
    /** sends a bidrectional message to the service worker with a response. */
    sendMessage: <T extends ServiceWorkerMessage>(message: T) => Promise<ServiceWorkerResponse<T['type']>>;
    /** listens to a service worker event. Returns an unsubscribe function. */
    on: <T extends ServiceWorkerMessageType = ServiceWorkerMessageType>(
        type: T,
        handler: ServiceWorkerClientMessageHandler<T>
    ) => () => void;
    /** unsubscribes a service worker event listener */
    off: <T extends ServiceWorkerMessageType = ServiceWorkerMessageType>(
        type: T,
        handler: ServiceWorkerClientMessageHandler<T>
    ) => void;
}

export const createServiceWorkerClient = (clientID: string): ServiceWorkerClient => {
    const handlers = new Map<ServiceWorkerMessageType, ServiceWorkerClientMessageHandler[]>();

    const handleChannelMessage = (event: MessageEvent<WithOrigin<ServiceWorkerMessage>>) => {
        try {
            if (event.data.origin === clientID) return;
            const handlersForType = handlers.get(event.data.type);
            handlersForType?.forEach((handler) => handler(event.data));
        } catch {}
    };

    const sw: ServiceWorkerClient = {
        register: async ({ onUpdateAvailable }) => {
            try {
                await registerServiceWorker();

                /* If the service worker controller is null at this point, we are
                 * dealing with an uncontrolled window (this may be to a hard-refresh) */
                if (navigator.serviceWorker.controller === null) {
                    const { active } = await navigator.serviceWorker.ready;
                    active?.postMessage({ type: 'claim' });
                }

                sw.send({ type: 'connect' });

                sw.on('check', ({ hash }) => {
                    if (hash !== config.COMMIT) {
                        logger.warn(`[ServiceWorkerClient] Update detected [${hash}]`);
                        onUpdateAvailable();
                    }
                });
            } catch (err) {
                logger.warn('[ServiceWorkerClient] Could not register service worker', err);
            }
        },

        listen: () => {
            navigator.serviceWorker.addEventListener('message', handleChannelMessage);
            SW_CLIENT_CHANNEL.addEventListener('message', handleChannelMessage);

            return () => {
                navigator.serviceWorker.removeEventListener('message', handleChannelMessage);
                SW_CLIENT_CHANNEL.removeEventListener('message', handleChannelMessage);
            };
        },

        send: (data, transfer) => {
            const message: WithOrigin<ServiceWorkerMessage> = { ...data, origin: clientID };
            navigator.serviceWorker.controller?.postMessage(message, { transfer });
        },

        sendMessage: (message) =>
            new Promise((resolve) => {
                const { port1, port2 } = new MessageChannel();

                port1.onmessage = (event) => {
                    resolve(event.data);
                    port1.close();
                    port2.close();
                };

                sw?.send(message, [port2]);
            }),

        on: (type, handler) => {
            const handlersForType = handlers.get(type) ?? [];
            handlersForType.push(handler);
            handlers.set(type, handlersForType);
            return () => sw.off(type, handler);
        },

        off: (type, handler) => {
            const handlersForType = handlers.get(type) ?? [];
            const filtered = handlersForType.filter((handlerForType) => handlerForType !== handler);
            handlers.set(type, filtered);
        },
    };

    return sw;
};
