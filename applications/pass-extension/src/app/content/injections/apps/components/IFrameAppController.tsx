import { IFRAME_APP_READY_EVENT } from 'proton-pass-extension/app/content/constants.static';
import { isIFrameMessage } from 'proton-pass-extension/app/content/injections/iframe/utils';
import type {
    IFrameCloseOptions,
    IFrameEndpoint,
    IFrameMessage,
    IFrameMessageType,
    IFrameMessageWithSender,
    IFramePortMessageHandler,
} from 'proton-pass-extension/app/content/types';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/types';
import type { Runtime } from 'webextension-polyfill';

import {
    contentScriptMessage,
    portForwardingMessage,
    sendMessage,
} from '@proton/pass/lib/extension/message/send-message';
import browser from '@proton/pass/lib/globals/browser';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { logger } from '@proton/pass/utils/logger';
import { objectHandler } from '@proton/pass/utils/object/handler';
import { type Subscriber, createPubSub } from '@proton/pass/utils/pubsub/factory';

export interface IFrameAppController {
    close: (options?: IFrameCloseOptions) => void;
    connect: (port: Runtime.Port, forwardTo: string) => void;
    disconnect: () => void;
    forwardMessage: (message: IFrameMessage) => void;
    getPort: () => MaybeNull<Runtime.Port>;
    init: () => () => void;
    injectPorts: (event: MessageEvent<Maybe<IFrameMessageWithSender>>) => void;
    postMessage: (message: any) => void;
    registerHandler: <M extends IFrameMessageType>(type: M, handler: IFramePortMessageHandler<M>) => () => void;
    resize: (height: number) => void;
    subscribe: (listener: Subscriber<Runtime.Port>) => () => void;
}

type PortContext = {
    port: MaybeNull<Runtime.Port>;
    forwardTo: MaybeNull<string>;
};

const acceptPortInjection = (
    event: MessageEvent
): event is MessageEvent<IFrameMessageWithSender<IFramePortMessageType.IFRAME_INJECT_PORT>> =>
    event.data && event.data.sender === 'contentscript' && event.data.type === IFramePortMessageType.IFRAME_INJECT_PORT;

export const createIFrameAppController = (endpoint: IFrameEndpoint) => {
    const connection = objectHandler<PortContext>({ port: null, forwardTo: null });
    const pubsub = createPubSub<Runtime.Port>();

    const IFrameBridge: IFrameAppController = {
        getPort: () => connection.get('port'),
        subscribe: pubsub.subscribe,

        init: () => {
            /** Notify the parent content-script that the IFrame is ready and
             * the react app has bootstrapped and rendered. This is essential
             * to avoid relying on the `load` event on the iframe document itself
             * which does not account for react lifecycle where the IFrameBridge
             * will be instantiated. */
            IFrameBridge.postMessage({ type: IFRAME_APP_READY_EVENT, endpoint });
            window.addEventListener('message', IFrameBridge.injectPorts);
            return () => window.removeEventListener('message', IFrameBridge.injectPorts);
        },

        connect: (port, forwardTo) => {
            connection.set('port', port);
            connection.set('forwardTo', forwardTo);
            pubsub.publish(port);

            IFrameBridge.forwardMessage({
                type: IFramePortMessageType.IFRAME_CONNECTED,
                payload: { framePort: port.name, id: endpoint },
            });

            port.onDisconnect.addListener(() => {
                connection.set('port', null);
                connection.set('forwardTo', null);
            });
        },

        disconnect: () => {
            logger.info(`[IFrame::${endpoint}] Unauthorized iframe injection`);

            const port = connection.get('port');
            connection.set('port', null);
            connection.set('forwardTo', null);
            safeCall(() => port?.disconnect())();

            /* unload the content-script & remove iframe content */
            void sendMessage(contentScriptMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT }));
            window.document?.documentElement?.remove();
        },

        injectPorts: safeCall((event: MessageEvent<Maybe<IFrameMessageWithSender>>) => {
            if (acceptPortInjection(event)) {
                void sendMessage.onSuccess(
                    contentScriptMessage({ type: WorkerMessageType.RESOLVE_EXTENSION_KEY }),
                    ({ key }) => {
                        if (key !== event.data.key) return IFrameBridge.disconnect();

                        const framePortName = `${event.data.payload.port}-${endpoint}`;
                        const port = browser.runtime.connect({ name: framePortName });
                        const forwardTo = event.data.payload.port;
                        IFrameBridge.connect(port, forwardTo);
                        window.removeEventListener('message', IFrameBridge.injectPorts);
                    }
                );
            }
        }),

        /* Forwards a message to the content-script through the worker's MessageBroker
         * see `@proton/pass/lib/extension/message/message-broker`. There is no direct
         * communication between the content-script and the injected frame. */
        forwardMessage: (message) => {
            try {
                const port = connection.get('port');
                const forwardTo = connection.get('forwardTo');

                if (port && forwardTo) {
                    port?.postMessage(
                        portForwardingMessage<IFrameMessageWithSender>(connection.get('forwardTo')!, {
                            ...message,
                            sender: endpoint,
                        })
                    );
                }
            } catch {}
        },

        /** Posts a message to the parent content-script frame.
         * NOTE: No sensitive information should transit on this channel */
        postMessage: (message) => window.parent.postMessage(message, '*'),

        /** Register a handler for a specific `IFrameMessageType`.
         * Returns an unsubscribe function. */
        registerHandler: <M extends IFrameMessageType>(type: M, handler: IFramePortMessageHandler<M>) => {
            const onMessageHandler = (message: unknown) => {
                if (isIFrameMessage(message) && message.type === type) {
                    handler(message as IFrameMessageWithSender<M>);
                }
            };

            const port = IFrameBridge.getPort();
            port?.onMessage.addListener(onMessageHandler);
            return () => port?.onMessage.removeListener(onMessageHandler);
        },

        close: (payload = {}) =>
            IFrameBridge.forwardMessage({
                type: IFramePortMessageType.IFRAME_CLOSE,
                payload,
            }),

        resize: (height) => {
            if (height > 0) {
                IFrameBridge.forwardMessage({
                    type: IFramePortMessageType.IFRAME_DIMENSIONS,
                    payload: { height },
                });
            }
        },
    };

    return IFrameBridge;
};
