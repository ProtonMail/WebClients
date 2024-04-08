import {
    type FC,
    type PropsWithChildren,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import type { MaybeNull } from '@proton/pass/types';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { PUBLIC_PATH } from '@proton/shared/lib/webpack.constants';

import { COMMIT } from '../config';
import type { ServiceWorkerResponse } from './channel';
import { CLIENT_CHANNEL, type ServiceWorkerMessage, type ServiceWorkerMessageType, type WithOrigin } from './channel';

export type ServiceWorkerMessageHandler<T extends ServiceWorkerMessageType = any> = (
    message: Extract<ServiceWorkerMessage, { type: T }>
) => void;

export type ServiceWorkerContextValue = {
    send: (message: ServiceWorkerMessage, transfer?: Transferable[]) => void;
    sendMessage: <T extends ServiceWorkerMessage>(message: T) => Promise<ServiceWorkerResponse<T['type']>>;
    on: <T extends ServiceWorkerMessageType = ServiceWorkerMessageType>(
        type: T,
        handler: ServiceWorkerMessageHandler<T>
    ) => void;
    off: <T extends ServiceWorkerMessageType = ServiceWorkerMessageType>(
        type: T,
        handler: ServiceWorkerMessageHandler<T>
    ) => void;
};

export const ServiceWorkerClientID = uniqueId(16);
export const ServiceWorkerEnabled = 'serviceWorker' in navigator;

export const ServiceWorkerContext = createContext<MaybeNull<ServiceWorkerContextValue>>(null);

export const ServiceWorkerProvider: FC<PropsWithChildren> = ({ children }) => {
    const origin = ServiceWorkerClientID;
    const [ready, setReady] = useState(false);
    const handlers = useRef<Map<ServiceWorkerMessageType, ServiceWorkerMessageHandler[]>>(new Map());

    const sw = useMemo<MaybeNull<ServiceWorkerContextValue>>(
        () =>
            ServiceWorkerEnabled
                ? {
                      send: (data, transfer) => {
                          if (ServiceWorkerEnabled) {
                              const message: WithOrigin<ServiceWorkerMessage> = { ...data, origin };
                              navigator.serviceWorker.controller?.postMessage(message, { transfer });
                          }
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
                          const handlersForType = handlers.current.get(type) ?? [];
                          handlersForType.push(handler);
                          handlers.current.set(type, handlersForType);
                      },

                      off: (type, handler) => {
                          const handlersForType = handlers.current.get(type) ?? [];
                          const filtered = handlersForType.filter((handlerForType) => handlerForType !== handler);
                          handlers.current.set(type, filtered);
                      },
                  }
                : null,
        []
    );

    useEffect(() => {
        if (ServiceWorkerEnabled) {
            const activated = awaiter<void>();

            navigator.serviceWorker
                .register(
                    /* webpackChunkName: "pass.service-worker" */
                    new URL('./service-worker', import.meta.url),
                    { scope: `/${stripLeadingAndTrailingSlash(PUBLIC_PATH)}` }
                )
                .then(async (reg) => {
                    /* If the service worker is active and there's no incoming
                     * worker, resolve the activation immediately */
                    const incoming = reg.installing || reg.waiting;
                    if (reg.active && !incoming) activated.resolve();
                    else {
                        /* If the service worker is not yet activated, wait
                         * for it to change to an `activated` state */
                        incoming!.onstatechange = (event) => {
                            const next = event.target as ServiceWorker;
                            if (next.state === 'activated') {
                                incoming!.onstatechange = null;
                                activated.resolve();
                            }
                        };
                    }

                    await activated;

                    /* If the service worker controller is null at this point,
                     * we are dealing with an uncontrolled window (this may be
                     * to a hard-refresh) */
                    if (navigator.serviceWorker.controller === null) {
                        const { active } = await navigator.serviceWorker.ready;
                        active?.postMessage({ type: 'claim' });
                    }

                    sw?.send({ type: 'connect' });

                    sw?.on('check', ({ hash }) => {
                        if (hash !== COMMIT) {
                            logger.info(`[ServiceWorkerProvider] New version detected [${hash}] - reloading`);
                            window.location.reload();
                        }
                    });
                })
                .catch(() => logger.warn('[ServiceWorkerProvider] Could not register service worker'))
                .finally(() => setReady(true));

            const handleChannelMessage = (event: MessageEvent<WithOrigin<ServiceWorkerMessage>>) => {
                try {
                    if (event.data.origin === ServiceWorkerClientID) return;
                    const handlersForType = handlers.current.get(event.data.type);
                    handlersForType?.forEach((handler) => handler(event.data));
                } catch {}
            };

            navigator.serviceWorker.addEventListener('message', handleChannelMessage);
            CLIENT_CHANNEL.addEventListener('message', handleChannelMessage);

            return () => {
                navigator.serviceWorker.removeEventListener('message', handleChannelMessage);
                CLIENT_CHANNEL.removeEventListener('message', handleChannelMessage);
            };
        } else setReady(true);
    }, []);

    return (
        <ServiceWorkerContext.Provider value={sw}>
            {ready ? children : <LobbyLayout overlay />}
        </ServiceWorkerContext.Provider>
    );
};

export const useServiceWorker = () => useContext(ServiceWorkerContext);
