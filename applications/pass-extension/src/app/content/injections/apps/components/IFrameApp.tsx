import type { PropsWithChildren } from 'react';
import { type FC, createContext, useCallback, useContext, useEffect, useState } from 'react';

import { IFRAME_APP_READY_EVENT } from 'proton-pass-extension/app/content/constants.static';
import type {
    IFrameCloseOptions,
    IFrameEndpoint,
    IFrameMessage,
    IFrameMessageType,
    IFrameMessageWithSender,
    IFramePortMessageHandler,
} from 'proton-pass-extension/app/content/types';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/types';
import locales from 'proton-pass-extension/app/locales';
import { INITIAL_WORKER_STATE } from 'proton-pass-extension/lib/components/Extension/ExtensionConnect';
import { useExtensionActivityProbe } from 'proton-pass-extension/lib/hooks/useExtensionActivityProbe';
import type { Runtime } from 'webextension-polyfill';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { clientReady } from '@proton/pass/lib/client';
import { contentScriptMessage, portForwardingMessage, sendMessage } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import { type ProxiedSettings, getInitialSettings } from '@proton/pass/store/reducers/settings';
import type { AppState, Maybe, MaybeNull, RecursivePartial } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { logger } from '@proton/pass/utils/logger';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import noop from '@proton/utils/noop';

export type IFrameContextValue = {
    endpoint: string;
    features: RecursivePartial<FeatureFlagState>;
    port: MaybeNull<Runtime.Port>;
    settings: ProxiedSettings;
    userEmail: MaybeNull<string>;
    visible: boolean;
    appState: AppState;
    close: (options?: IFrameCloseOptions) => void;
    forwardMessage: (message: IFrameMessage) => void;
    postMessage: (message: any) => void;
    registerHandler: <M extends IFrameMessageType>(type: M, handler: IFramePortMessageHandler<M>) => () => void;
    resize: (height: number) => void;
};

export const IFrameContext = createContext<MaybeNull<IFrameContextValue>>(null);

type PortContext = { port: MaybeNull<Runtime.Port>; forwardTo: MaybeNull<string> };

/* The IFrameContextProvider is responsible for opening a new
 * dedicated port with the service-worker and sending out port-
 * forwarding messages to the content-script's ports. We retrieve
 * the content-script's parent port name through postMessaging */
export const IFrameApp: FC<PropsWithChildren<{ endpoint: IFrameEndpoint }>> = ({ endpoint, children }) => {
    const { i18n } = usePassCore();
    const [{ port, forwardTo }, setPortContext] = useState<PortContext>({ port: null, forwardTo: null });
    const [appState, setAppState] = useState<IFrameContextValue['appState']>(INITIAL_WORKER_STATE);
    const [settings, setSettings] = useState<ProxiedSettings>(getInitialSettings());
    const [features, setFeatures] = useState<RecursivePartial<FeatureFlagState>>({});
    const [userEmail, setUserEmail] = useState<MaybeNull<string>>(null);
    const [visible, setVisible] = useState<boolean>(false);

    const activityProbe = useExtensionActivityProbe(contentScriptMessage);

    const destroyFrame = () => {
        logger.info(`[IFrame::${endpoint}] Unauthorized iframe injection`);

        safeCall(() => port?.disconnect())();
        setPortContext({ port: null, forwardTo: null });

        /* unload the content-script & remove iframe content */
        void sendMessage(contentScriptMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT }));
        window.document?.documentElement?.remove();
    };

    const postMessage = useCallback((message: any) => window.parent.postMessage(message, '*'), []);

    useEffect(() => {
        /** Notify the parent content-script that the IFrame is ready and
         * the react app has bootstrapped and rendered. This is essential
         * to avoid relying on the `load` event which does not account for
         * react lifecycle */
        postMessage({ type: IFRAME_APP_READY_EVENT, endpoint });
    }, []);

    /* when processing an `IFRAME_INJECT_PORT` message : verify the
     * `message.key` against the resolved extension key. This avoids
     * malicious websites from trying to spoof our content-script port
     * injection. If we detect a mismatch between the keys : destroy. */
    const handlePortInjection = useCallback(
        async (message: IFrameMessageWithSender<IFramePortMessageType.IFRAME_INJECT_PORT>) =>
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
        safeCall((event: MessageEvent<Maybe<IFrameMessageWithSender>>) => {
            if (
                event.data &&
                event.data?.type === IFramePortMessageType.IFRAME_INJECT_PORT &&
                event.data.sender === 'contentscript'
            ) {
                handlePortInjection(event.data).catch(noop);
            }
        }),
        []
    );

    useEffect(() => {
        if (userEmail === null && clientReady(appState.status)) {
            sendMessage
                .onSuccess(
                    contentScriptMessage({ type: WorkerMessageType.RESOLVE_USER }),
                    (response) => response.user?.Email && setUserEmail(response.user.Email)
                )
                .catch(noop);
        }
    }, [appState, userEmail]);

    useEffect(() => {
        setTtagLocales(locales);
        window.addEventListener('message', onPostMessageHandler);
        return () => window.removeEventListener('message', onPostMessageHandler);
    }, []);

    useEffect(() => {
        if (port && forwardTo) {
            port.onMessage.addListener((message: Maybe<IFrameMessage>) => {
                switch (message?.type) {
                    case IFramePortMessageType.IFRAME_INIT:
                        setAppState(message.payload.workerState);
                        setSettings(message.payload.settings);
                        setFeatures(message.payload.features);
                        /** immediately set the locale on iframe init : the `IFramContextProvider`
                         * does not use the standard `ExtensionApp` wrapper which takes care of
                         * hydrating the initial locale and watching for language changes */
                        i18n.setLocale(message.payload.settings.locale).catch(noop);
                        return;
                    case IFramePortMessageType.IFRAME_HIDDEN:
                        return setVisible(false);
                    case IFramePortMessageType.IFRAME_OPEN:
                        return setVisible(true);
                    case WorkerMessageType.FEATURE_FLAGS_UPDATE:
                        return setFeatures(message.payload);
                    case WorkerMessageType.SETTINGS_UPDATE:
                        return setSettings(message.payload);
                    case WorkerMessageType.LOCALE_UPDATED:
                        return i18n.setLocale(settings.locale).catch(noop);
                    /* If for any reason we get a `PORT_UNAUTHORIZED`
                     * message : it likely means the iframe was injected
                     * without being controlled by a content-script either
                     * accidentally or intentionnally. Just to be safe, clear
                     * the frame's innerHTML */
                    case WorkerMessageType.PORT_UNAUTHORIZED:
                        return destroyFrame();
                    case WorkerMessageType.WORKER_STATE_CHANGE:
                        return setAppState(message.payload.state);
                }
            });

            port.postMessage(
                portForwardingMessage<IFrameMessageWithSender<IFramePortMessageType.IFRAME_CONNECTED>>(forwardTo, {
                    sender: endpoint,
                    type: IFramePortMessageType.IFRAME_CONNECTED,
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
     * see `@proton/pass/lib/extension/message/message-broker` */
    const forwardMessage = useCallback(
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

    const close = useCallback(
        (payload: IFrameCloseOptions = {}) => forwardMessage({ type: IFramePortMessageType.IFRAME_CLOSE, payload }),
        [forwardMessage]
    );

    const resize = useCallback(
        (height: number) => {
            if (height > 0) forwardMessage({ type: IFramePortMessageType.IFRAME_DIMENSIONS, payload: { height } });
        },
        [forwardMessage]
    );

    const registerHandler = useCallback(
        <M extends IFrameMessageType>(type: M, handler: IFramePortMessageHandler<M>) => {
            const onMessageHandler = (message: Maybe<IFrameMessageWithSender>) => {
                if (message?.type === type) {
                    handler(message as IFrameMessageWithSender<M>);
                }
            };

            port?.onMessage.addListener(onMessageHandler);
            return () => port?.onMessage.removeListener(onMessageHandler);
        },
        [port]
    );

    useEffect(() => {
        if (visible && appState.authorized) activityProbe.start();
        else activityProbe.cancel();
    }, [visible]);

    return (
        <IFrameContext.Provider
            value={{
                endpoint,
                features,
                port,
                settings,
                userEmail,
                visible,
                appState,
                close,
                forwardMessage,
                postMessage,
                registerHandler,
                resize,
            }}
        >
            {children}
        </IFrameContext.Provider>
    );
};

export const useIFrameContext = () => {
    const ctx = useContext(IFrameContext);
    if (!ctx) throw new Error('IFrameContext not initialized');
    return ctx;
};

export const useRegisterMessageHandler = <M extends IFrameMessageType>(
    type: M,
    handler: IFramePortMessageHandler<M>
) => {
    const ctx = useIFrameContext();
    useEffect(() => ctx.registerHandler(type, handler), [type, handler, ctx.registerHandler]);
};
