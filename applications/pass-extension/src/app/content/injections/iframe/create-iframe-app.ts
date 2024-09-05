import { IFRAME_APP_READY_EVENT } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ProtonPassRoot } from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassRoot';
import type {
    IFrameApp,
    IFrameCloseOptions,
    IFrameEndpoint,
    IFrameInitPayload,
    IFrameMessage,
    IFrameMessageType,
    IFrameMessageWithSender,
    IFramePortMessageHandler,
    IFramePosition,
    IFrameState,
} from 'proton-pass-extension/app/content/types';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/types';
import type { Runtime } from 'webextension-polyfill';

import {
    contentScriptMessage,
    portForwardingMessage,
    sendMessage,
} from '@proton/pass/lib/extension/message/send-message';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import type { Dimensions, Rect } from '@proton/pass/types/utils/dom';
import { pixelEncoder } from '@proton/pass/utils/dom/computed-styles';
import { createElement } from '@proton/pass/utils/dom/create-element';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { merge } from '@proton/pass/utils/object/merge';
import noop from '@proton/utils/noop';

type CreateIFrameAppOptions<A> = {
    animation: 'slidein' | 'fadein';
    backdropClose: boolean;
    classNames?: string[];
    id: IFrameEndpoint;
    src: string;
    root: ProtonPassRoot;
    backdropExclude?: () => HTMLElement[];
    onError?: (error: unknown) => void;
    onOpen?: (state: IFrameState<A>) => void;
    onClose?: (state: IFrameState<A>, options: IFrameCloseOptions) => void;
    position: (iframeRoot: HTMLElement) => Partial<Rect>;
    dimensions: (state: IFrameState<A>) => Dimensions;
};

export const createIFrameApp = <A>({
    animation,
    backdropClose,
    classNames = [],
    id,
    src,
    root,
    backdropExclude,
    onError,
    onOpen,
    onClose,
    position,
    dimensions,
}: CreateIFrameAppOptions<A>): IFrameApp<A> => {
    const portMessageHandlers: Map<IFrameMessageType, IFramePortMessageHandler> = new Map();

    const state: IFrameState<A> = {
        action: null,
        framePort: null,
        loaded: false,
        port: null,
        position: { top: -1, left: -1, right: -1, bottom: -1 },
        positionReq: -1,
        ready: false,
        visible: false,
    };

    const ensureStale = withContext<() => boolean>((ctx) => Boolean(ctx?.getState().stale));
    const ensureLoaded = () => waitUntil({ check: () => state.loaded, cancel: ensureStale }, 50);
    const ensureReady = () => waitUntil({ check: () => state.ready, cancel: ensureStale }, 50);

    const listeners = createListenerStore();
    const activeListeners = createListenerStore();

    const iframe = createElement<HTMLIFrameElement>({
        type: 'iframe',
        classNames,
        attributes: { src },
        parent: root,
        shadow: true,
    });

    iframe.style.setProperty(`--frame-animation`, animation);

    const unlisten = listeners.addListener(window, 'message', (event) => {
        if (event.data.type === IFRAME_APP_READY_EVENT && event.data.endpoint === id) {
            state.loaded = true;
            unlisten();
        }
    });

    /* Securing the posted message's allowed target origins.
     * Ensure the iframe has been correctly loaded before sending
     * out any message: the iframe.contentWindow::origin may be
     * incorrect otherwise */
    const sendSecurePostMessage = (message: IFrameMessage) =>
        sendMessage
            .onSuccess(contentScriptMessage({ type: WorkerMessageType.RESOLVE_EXTENSION_KEY }), async ({ key }) =>
                ensureLoaded()
                    .then(() => {
                        const secureMessage: IFrameMessageWithSender = { ...message, key, sender: 'contentscript' };
                        iframe.contentWindow?.postMessage(secureMessage, src);
                    })
                    .catch(noop)
            )
            .catch((e) => onError?.(e));

    /* In order to communicate with the iframe, we're leveraging
     * the worker's MessageBroker port-forwarding capabilities.
     * This allows by-passing a FF limitation not letting us access
     * the Tabs API in an iframe-injected `web_accessible_resource`
     * to directly open a port with the current tab */
    const sendPortMessage = (rawMessage: IFrameMessage) => {
        const message: IFrameMessageWithSender = { ...rawMessage, sender: 'contentscript' };
        return ensureReady()
            .then(() => state.port?.postMessage(portForwardingMessage(state.framePort!, message)))
            .catch((e) => onError?.(e));
    };

    /* As we are now using a single port for the whole content-script,
     * make sure to filter messages not only by type but by sender id */
    const registerMessageHandler = <M extends IFrameMessageType>(
        type: M,
        handler: (message: IFrameMessageWithSender<M>) => void
    ) => {
        const safeHandler = (message: Maybe<IFrameMessageWithSender>) => {
            if (message?.type === type && message.sender === id) {
                handler(message as IFrameMessageWithSender<M>);
            }
        };

        portMessageHandlers.set(type, safeHandler);
        return () => portMessageHandlers.delete(type);
    };

    const getPosition = (): IFramePosition => state.position;

    const setIframePosition = (values: IFramePosition) => {
        state.position = values;

        const { top, left, right } = values;
        iframe.style.setProperty(`--frame-top`, top ? pixelEncoder(top) : 'unset');
        iframe.style.setProperty(`--frame-left`, left ? pixelEncoder(left) : 'unset');
        iframe.style.setProperty(`--frame-right`, right ? pixelEncoder(right) : 'unset');
    };

    const setIframeDimensions = ({ width, height }: Dimensions) => {
        iframe.style.setProperty(`--frame-width`, pixelEncoder(width));
        iframe.style.setProperty(`--frame-height`, pixelEncoder(height));
    };

    const updatePosition = () => {
        cancelAnimationFrame(state.positionReq);
        state.positionReq = requestAnimationFrame(() => setIframePosition(position(root)));
    };

    const close = (options: IFrameCloseOptions = {}) => {
        cancelAnimationFrame(state.positionReq);
        activeListeners.removeAll();

        if (state.visible) {
            const target = (options?.event?.target ?? null) as MaybeNull<HTMLElement>;

            if (!target || !backdropExclude?.().includes(target)) {
                listeners.removeAll();
                onClose?.(state, options); /* ⚠️ call before resetting state */

                iframe.classList.remove('visible');
                state.visible = false;
                state.action = null;

                void sendPortMessage({ type: IFramePortMessageType.IFRAME_HIDDEN });
            }
        }
    };

    const open = (action: A, scrollRef?: HTMLElement) => {
        if (!state.visible) {
            state.action = action;
            state.visible = true;

            activeListeners.addListener(window, 'resize', updatePosition);
            activeListeners.addListener(window, 'scroll', updatePosition);
            activeListeners.addListener(scrollRef, 'scroll', updatePosition);

            if (backdropClose) {
                const onMouseDown = (event: Event) => close({ event, discard: true, refocus: false });
                activeListeners.addListener(window, 'mousedown', onMouseDown);
            }

            void sendPortMessage({ type: IFramePortMessageType.IFRAME_OPEN });

            iframe.classList.add('visible');
            setIframeDimensions(dimensions(state));
            updatePosition();
            onOpen?.(state);
        }
    };

    const onMessageHandler = (message: Maybe<IFrameMessageWithSender>) =>
        message && message?.type !== undefined && portMessageHandlers.get(message.type)?.(message);

    const init = async (port: Runtime.Port, payload: IFrameInitPayload) => {
        state.port?.disconnect();
        state.port = port;
        state.port.onMessage.addListener(onMessageHandler);
        state.port.onDisconnect.addListener(() => (state.ready = false));

        void sendSecurePostMessage({
            type: IFramePortMessageType.IFRAME_INJECT_PORT,
            payload: { port: port.name },
        }).then(() =>
            sendPortMessage({
                type: IFramePortMessageType.IFRAME_INIT,
                payload,
            })
        );
    };

    const destroy = () => {
        close({ discard: false, refocus: false });
        listeners.removeAll();
        activeListeners.removeAll();
        state.port?.onMessage.removeListener(onMessageHandler);
        safeCall(() => root.removeChild(iframe))();
        state.port = null;
    };

    registerMessageHandler(IFramePortMessageType.IFRAME_CONNECTED, ({ payload: { framePort } }) => {
        state.ready = true;
        state.framePort = framePort;
    });

    registerMessageHandler(IFramePortMessageType.IFRAME_CLOSE, (message) => close(message.payload));

    registerMessageHandler(IFramePortMessageType.IFRAME_DIMENSIONS, (message) => {
        const { width, height } = merge(dimensions(state), { height: message.payload.height });
        return setIframeDimensions({ width, height });
    });

    return {
        element: iframe,
        state,
        close,
        destroy,
        getPosition,
        init,
        ensureLoaded,
        ensureReady,
        open,
        registerMessageHandler,
        sendPortMessage,
        updatePosition,
    };
};
