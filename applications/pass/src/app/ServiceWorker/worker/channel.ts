import { SW_CLIENT_CHANNEL } from 'proton-pass-web/app/ServiceWorker/constants';
import type {
    ServiceWorkerMessage,
    ServiceWorkerMessageHandler,
    ServiceWorkerMessageType,
    WithOrigin,
} from 'proton-pass-web/app/ServiceWorker/types';

import { logger } from '@proton/pass/utils/logger';

export const ServiceWorkerMessageBroker = (() => {
    const handlers: Map<ServiceWorkerMessageType, ServiceWorkerMessageHandler<any>> = new Map();

    return {
        register: <T extends ServiceWorkerMessageType>(type: T, handler: ServiceWorkerMessageHandler<T>) =>
            handlers.set(type, handler),

        onMessage: async (event: ExtendableMessageEvent) => {
            const port = event.ports?.[0];
            const message = event.data as WithOrigin<ServiceWorkerMessage>;
            const handler = handlers.get(message.type);

            if (message.broadcast) SW_CLIENT_CHANNEL.postMessage(message);

            if (handler) {
                try {
                    const response = (await handler(message)) as any;
                    if (port && response) port.postMessage(response);
                } catch (err) {
                    logger.error(`[ServiceWorker] Error processing [${message.type}]`, err);
                }
            }
        },
    };
})();
