import { type FC, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Runtime } from 'webextension-polyfill';

import { contentScriptMessage, portForwardingMessage, sendMessage } from '@proton/pass/extension/message';
import browser from '@proton/pass/globals/browser';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { Maybe, MaybeNull, WorkerMessage, WorkerState } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { safeCall } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { workerReady } from '@proton/pass/utils/worker';
import noop from '@proton/utils/noop';

import { INITIAL_SETTINGS } from '../../../../shared/constants';
import { useActivityProbe } from '../../../../shared/hooks/useActivityProbe';
import type {
    IFrameCloseOptions,
    IFrameEndpoint,
    IFrameMessage,
    IFrameMessageWithSender,
    IFramePortMessageHandler,
    IFrameSecureMessage,
} from '../../../types';
import { IFrameMessageType } from '../../../types';

type IFrameContextValue = {
    port: MaybeNull<Runtime.Port>;
    endpoint: string;
    workerState: Maybe<Omit<WorkerState, 'UID'>>;
    settings: ProxiedSettings;
    userEmail: MaybeNull<string>;
    visible: boolean;
    closeIFrame: (options?: IFrameCloseOptions) => void;
    resizeIFrame: (ref?: MaybeNull<HTMLElement>) => void;
    postMessage: (message: IFrameMessage) => void;
    registerHandler: <M extends IFrameMessage['type']>(type: M, handler: IFramePortMessageHandler<M>) => void;
};

type PortContext = { port: MaybeNull<Runtime.Port>; forwardTo: MaybeNull<string> };

const IFrameContext = createContext<IFrameContextValue>({
    port: null,
    endpoint: '',
    workerState: undefined,
    settings: INITIAL_SETTINGS,
    userEmail: null,
    visible: false,
    closeIFrame: noop,
    resizeIFrame: noop,
    postMessage: noop,
    registerHandler: noop,
});

/* The IFrameContextProvider is responsible for opening a new
 * dedicated port with the service-worker and sending out port-
 * forwarding messages to the content-script's ports. We retrieve
 * the content-script's parent port name through postMessaging */
export const IFrameContextProvider: FC<{ endpoint: IFrameEndpoint }> = ({ endpoint, children }) => {
    const [{ port, forwardTo }, setPortContext] = useState<PortContext>({ port: null, forwardTo: null });
    const [workerState, setWorkerState] = useState<IFrameContextValue['workerState']>();
    const [settings, setSettings] = useState<ProxiedSettings>(INITIAL_SETTINGS);
    const [userEmail, setUserEmail] = useState<MaybeNull<string>>(null);
    const [visible, setVisible] = useState<boolean>(false);
    const activityProbe = useActivityProbe(contentScriptMessage);

    const destroyFrame = () => {
        logger.info(`[IFrame::${endpoint}] Unauthorized iframe injection`);

        safeCall(() => port?.disconnect())();
        setPortContext({ port: null, forwardTo: null });

        /* unload the content-script & remove iframe content */
        void sendMessage(contentScriptMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT }));
        window.document?.documentElement?.remove();
    };

    /* when processing an `IFRAME_INJECT_PORT` message : verify the
     * `message.key` against the resolved extension key. This avoids
     * malicious websites from trying to spoof our content-script port
     * injection. If we detect a mismatch between the keys : destroy. */
    const handlePortInjection = useCallback(
        async (message: IFrameSecureMessage<IFrameMessageType.IFRAME_INJECT_PORT>) =>
            sendMessage.onSuccess(
                contentScriptMessage({ type: WorkerMessageType.RESOLVE_EXTENSION_KEY }),
                ({ key }) => {
                    if (key !== message.key) return destroyFrame();

                    const framePortName = `${message.payload.port}-${endpoint}`;
                    const port = browser.runtime.connect({ name: framePortName });
                    const forwardTo = message.payload.port;
                    setPortContext({ port, forwardTo });
                }
            ),
        []
    );

    const onPostMessageHandler = useCallback(
        safeCall((event: MessageEvent<Maybe<IFrameSecureMessage>>) => {
            if (
                event.data &&
                event.data?.type === IFrameMessageType.IFRAME_INJECT_PORT &&
                event.data.sender === 'contentscript'
            ) {
                handlePortInjection(event.data).catch(noop);
            }
        }),
        []
    );

    useEffect(() => {
        if (userEmail === null && workerState && workerReady(workerState?.status)) {
            sendMessage
                .onSuccess(
                    contentScriptMessage({ type: WorkerMessageType.RESOLVE_USER_DATA }),
                    (response) => response.user?.Email && setUserEmail(response.user.Email)
                )
                .catch(noop);
        }
    }, [workerState, userEmail]);

    useEffect(() => {
        window.addEventListener('message', onPostMessageHandler);
        return () => window.removeEventListener('message', onPostMessageHandler);
    }, [endpoint]);

    useEffect(() => {
        if (port && forwardTo) {
            port.onMessage.addListener((message: Maybe<IFrameMessage | WorkerMessage>) => {
                switch (message?.type) {
                    case IFrameMessageType.IFRAME_INIT:
                        setWorkerState(message.payload.workerState);
                        setSettings(message.payload.settings);
                        return;
                    case IFrameMessageType.IFRAME_OPEN:
                        return setVisible(true);
                    case IFrameMessageType.IFRAME_HIDDEN:
                        return setVisible(false);
                    /* If for any reason we get a `PORT_UNAUTHORIZED`
                     * message : it likely means the iframe was injected
                     * without being controlled by a content-script either
                     * accidentally or intentionnally. Just to be safe, clear
                     * the frame's innerHTML */
                    case WorkerMessageType.PORT_UNAUTHORIZED:
                        return destroyFrame();
                }
            });

            port.postMessage(
                portForwardingMessage<IFrameMessageWithSender<IFrameMessageType.IFRAME_CONNECTED>>(forwardTo, {
                    sender: endpoint,
                    type: IFrameMessageType.IFRAME_CONNECTED,
                    payload: { framePort: port.name, id: endpoint },
                })
            );

            port.onDisconnect.addListener(() => {
                setPortContext({ port: null, forwardTo: null });
                window.addEventListener('message', onPostMessageHandler);
            });
        }

        return safeCall(() => port?.disconnect());
    }, [port, forwardTo]);

    /* Every message sent will be forwarded to the content-script
     * through the worker's MessageBroker.
     * see `@proton/pass/extension/message/message-broker` */
    const postMessage = useCallback(
        (rawMessage: IFrameMessage) => {
            try {
                port?.postMessage(
                    portForwardingMessage<IFrameMessageWithSender>(forwardTo!, {
                        ...rawMessage,
                        sender: endpoint,
                    })
                );
            } catch (_) {}
        },
        [port, forwardTo]
    );

    const closeIFrame = useCallback(
        (payload: IFrameCloseOptions = {}) => postMessage({ type: IFrameMessageType.IFRAME_CLOSE, payload }),
        [postMessage]
    );

    const resizeIFrame = useCallback(
        (el?: MaybeNull<HTMLElement>) => {
            requestAnimationFrame(() => {
                if (el) {
                    const { height } = el.getBoundingClientRect();
                    postMessage({ type: IFrameMessageType.IFRAME_DIMENSIONS, payload: { height } });
                }
            });
        },
        [postMessage]
    );

    const registerHandler = useCallback(
        <M extends IFrameMessage['type']>(type: M, handler: IFramePortMessageHandler<M>) => {
            const onMessageHandler = (message: Maybe<IFrameMessageWithSender>) =>
                message?.type === type &&
                message.sender === 'contentscript' &&
                handler(message as IFrameMessageWithSender<M>);

            port?.onMessage.addListener(onMessageHandler);
            return () => port?.onMessage.removeListener(onMessageHandler);
        },
        [port]
    );

    useEffect(() => {
        if (visible) activityProbe.start();
        else activityProbe.cancel();
    }, [visible]);

    const context = useMemo<IFrameContextValue>(
        () => ({
            port,
            endpoint,
            workerState,
            settings,
            userEmail,
            visible,
            closeIFrame,
            resizeIFrame,
            postMessage,
            registerHandler,
        }),
        [port, workerState, settings, userEmail, visible, closeIFrame, resizeIFrame, postMessage, registerHandler]
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
