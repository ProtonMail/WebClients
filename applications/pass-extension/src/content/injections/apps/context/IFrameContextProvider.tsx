import { type FC, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Runtime } from 'webextension-polyfill';

import { portForwardingMessage } from '@proton/pass/extension/message';
import browser from '@proton/pass/globals/browser';
import { Maybe, MaybeNull, WorkerMessage, WorkerMessageType, WorkerState } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import {
    IFrameEndpoint,
    IFrameMessage,
    IFrameMessageType,
    IFrameMessageWithSender,
    IFramePortMessageHandler,
} from '../../../types';

type IFrameContextValue = {
    workerState: Maybe<Omit<WorkerState, 'UID'>>;
    port: MaybeNull<Runtime.Port>;
    closeIFrame: () => void;
    resizeIFrame: (ref?: MaybeNull<HTMLElement>) => void;
    postMessage: (message: IFrameMessage) => void;
    registerHandler: <M extends IFrameMessage['type']>(type: M, handler: IFramePortMessageHandler<M>) => void;
};

type PortContext = { port: MaybeNull<Runtime.Port>; forwardTo: MaybeNull<string> };

const IFrameContext = createContext<IFrameContextValue>({
    workerState: undefined,
    port: null,
    closeIFrame: noop,
    resizeIFrame: noop,
    postMessage: noop,
    registerHandler: noop,
});

/**
 * The IFrameContextProvider is responsible for opening a new
 * dedicated port with the service-worker and sending out port-
 * forwarding messages to the content-script's ports. We retrieve
 * the content-script's parent port name through postMessaging
 * which is secured by the extension's CSP policies.
 */
export const IFrameContextProvider: FC<{ endpoint: IFrameEndpoint }> = ({ endpoint, children }) => {
    const [{ port, forwardTo }, setPortContext] = useState<PortContext>({ port: null, forwardTo: null });
    const [workerState, setWorkerState] = useState<IFrameContextValue['workerState']>();

    useEffect(() => {
        let framePortRef: Runtime.Port;

        const portInitHandler = (event: MessageEvent<Maybe<IFrameMessageWithSender>>) => {
            if (
                event.data !== undefined &&
                event.data?.type === IFrameMessageType.IFRAME_INJECT_PORT &&
                event.data.sender === 'content-script'
            ) {
                window.removeEventListener('message', portInitHandler);

                /* Open a new dedicated port with the worker */
                const message = event.data;
                const framePortName = `${message.payload.port}-${endpoint}`;
                framePortRef = browser.runtime.connect({ name: framePortName });

                framePortRef.onMessage.addListener((message: Maybe<IFrameMessage | WorkerMessage>) => {
                    switch (message?.type) {
                        case IFrameMessageType.IFRAME_INIT:
                            return setWorkerState(message.payload.workerState);

                        /* If for any reason we get a `PORT_UNAUTHORIZED`
                         * message : it likely means the iframe was injected
                         * without being controlled by a content-script either
                         * accidentally or intentionnally. Just to be safe, clear
                         * the frame's innerHTML */
                        case WorkerMessageType.PORT_UNAUTHORIZED: {
                            logger.warn(`[IFrame::${endpoint}] Unauthorized iframe injection`);
                            return window.document.documentElement.remove();
                        }
                    }
                });

                framePortRef.postMessage(
                    portForwardingMessage<IFrameMessageWithSender<IFrameMessageType.IFRAME_CONNECTED>>(
                        message.payload.port,
                        {
                            sender: endpoint,
                            type: IFrameMessageType.IFRAME_CONNECTED,
                            payload: { framePort: framePortName, id: endpoint },
                        }
                    )
                );

                framePortRef.onDisconnect.addListener(() => {
                    setPortContext({ port: null, forwardTo: null });
                    window.addEventListener('message', portInitHandler);
                });

                setPortContext({ port: framePortRef, forwardTo: message.payload.port });
            }
        };

        window.addEventListener('message', portInitHandler);

        return () => {
            framePortRef.disconnect();
            window.removeEventListener('message', portInitHandler);
        };
    }, [endpoint]);

    /* Every message sent will be forwarded to the content-script
     * through the worker's MessageBroker.
     * see `@proton/pass/extension/message/message-broker` */
    const postMessage = useCallback(
        (rawMessage: IFrameMessage) => {
            port?.postMessage(
                portForwardingMessage<IFrameMessageWithSender>(forwardTo!, {
                    ...rawMessage,
                    sender: endpoint,
                })
            );
        },
        [port, forwardTo]
    );

    const closeIFrame = useCallback(() => postMessage({ type: IFrameMessageType.IFRAME_CLOSE }), [postMessage]);

    const resizeIFrame = useCallback(
        (el?: MaybeNull<HTMLElement>) =>
            requestAnimationFrame(() => {
                if (el) {
                    const { height } = el.getBoundingClientRect();
                    postMessage({ type: IFrameMessageType.IFRAME_DIMENSIONS, payload: { height } });
                }
            }),
        [postMessage]
    );

    const registerHandler = useCallback(
        <M extends IFrameMessage['type']>(type: M, handler: IFramePortMessageHandler<M>) => {
            const onMessageHandler = (message: Maybe<IFrameMessageWithSender>) =>
                message?.type === type &&
                message.sender === 'content-script' &&
                handler(message as IFrameMessageWithSender<M>);

            port?.onMessage.addListener(onMessageHandler);

            return () => port?.onMessage.removeListener(onMessageHandler);
        },
        [port]
    );

    const context = useMemo<IFrameContextValue>(
        () => ({ port, closeIFrame, resizeIFrame, postMessage, registerHandler, workerState }),
        [port, workerState, closeIFrame, resizeIFrame, postMessage, registerHandler]
    );

    return <IFrameContext.Provider value={context}>{children}</IFrameContext.Provider>;
};

export const useIFrameContext = () => useContext(IFrameContext);

export const useRegisterMessageHandler = <M extends IFrameMessage['type']>(
    type: M,
    handler: IFramePortMessageHandler<M>
) => {
    const { registerHandler } = useIFrameContext();
    useEffect(() => registerHandler(type, handler), [type, handler, registerHandler]);
};
