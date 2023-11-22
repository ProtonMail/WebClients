import { type FC, createContext, useContext, useEffect, useMemo, useRef } from 'react';

import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { PUBLIC_PATH } from '@proton/shared/lib/constants';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import noop from '@proton/utils/noop';

import { CLIENT_CHANNEL, type ServiceWorkerMessage, type ServiceWorkerMessageType, type WithOrigin } from './channel';

export type ServiceWorkerMessageHandler<T extends ServiceWorkerMessageType = any> = (
    message: Extract<ServiceWorkerMessage, { type: T }>
) => void;

type ServiceWorkerContextValue = {
    send: (message: ServiceWorkerMessage) => void;
    on: <T extends ServiceWorkerMessageType = ServiceWorkerMessageType>(
        type: T,
        handler: ServiceWorkerMessageHandler<T>
    ) => void;
    off: <T extends ServiceWorkerMessageType = ServiceWorkerMessageType>(
        type: T,
        handler: ServiceWorkerMessageHandler<T>
    ) => void;
};

export const ServiceWorkerContext = createContext<ServiceWorkerContextValue>({ send: noop, on: noop, off: noop });
export const ServiceWorkerClientID = uniqueId(16);

export const ServiceWorkerProvider: FC = ({ children }) => {
    const handlers = useRef<Map<ServiceWorkerMessageType, ServiceWorkerMessageHandler[]>>(new Map());

    const context = useMemo<ServiceWorkerContextValue>(
        () => ({
            send: (data) => {
                const message: WithOrigin<ServiceWorkerMessage> = { ...data, origin: ServiceWorkerClientID };
                navigator.serviceWorker.controller?.postMessage(message);
            },
            on: (type, handler) => {
                const handlersForType = handlers.current.get(type) ?? [];
                handlersForType.push(handler);
                handlers.current.set(type, handlersForType);
            },
            off: (type, handler) => {
                const handlersForType = handlers.current.get(type) ?? [];
                const filtered = handlersForType.filter((handlerForType) => handlerForType !== handler);
                handlers.current.set(type, filtered);
            },
        }),
        []
    );

    useEffect(() => {
        navigator.serviceWorker
            .register(
                /* webpackChunkName: "pass.service-worker" */
                new URL('./service-worker', import.meta.url),
                { scope: `/${stripLeadingAndTrailingSlash(PUBLIC_PATH)}` }
            )
            .then(() => context.send({ type: 'ping' }))
            .catch(() => logger.warn('[ServiceWorkerProvider] Could not register service worker'));

        const handleChannelMessage = (event: MessageEvent<WithOrigin<ServiceWorkerMessage>>) => {
            try {
                if (event.data.origin === ServiceWorkerClientID) return;
                const handlersForType = handlers.current.get(event.data.type);
                handlersForType?.forEach((handler) => handler(event.data));
            } catch {}
        };

        CLIENT_CHANNEL.addEventListener('message', handleChannelMessage);
        return () => CLIENT_CHANNEL.removeEventListener('message', handleChannelMessage);
    }, []);

    return <ServiceWorkerContext.Provider value={context}>{children}</ServiceWorkerContext.Provider>;
};

export const useServiceWorker = () => useContext(ServiceWorkerContext);
