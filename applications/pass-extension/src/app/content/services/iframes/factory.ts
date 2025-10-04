import { IFRAME_APP_READY_EVENT } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type {
    IFrameCloseOptions,
    IFrameInitPayload,
    IFrameMessage,
    IFrameMessageType,
    IFrameMessageWithSender,
    IFramePortMessageHandler,
    IFramePosition,
} from 'proton-pass-extension/app/content/services/iframes/messages';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/services/iframes/messages';
import type { PopoverController } from 'proton-pass-extension/app/content/services/iframes/popover';
import { isIFrameMessage } from 'proton-pass-extension/app/content/services/iframes/utils';
import { sendContentScriptTelemetry } from 'proton-pass-extension/app/content/utils/telemetry';
import {
    contentScriptMessage,
    portForwardingMessage,
    sendMessage,
} from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { Runtime } from 'webextension-polyfill';

import { MODEL_VERSION } from '@proton/pass/constants';
import type { Coords, Maybe, MaybeNull } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import type { Dimensions, Rect } from '@proton/pass/types/utils/dom';
import { pixelEncoder } from '@proton/pass/utils/dom/computed-styles';
import { createElement } from '@proton/pass/utils/dom/create-element';
import { TopLayerManager } from '@proton/pass/utils/dom/popover';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import type { Subscriber } from '@proton/pass/utils/pubsub/factory';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';

type CreateIFrameAppOptions<A> = {
    /** Entering animation on visibility toggles */
    animation: 'slidein' | 'fadein';
    /** Backdrop auto-closing configuration */
    backdrop?: { exclude: () => Element[]; enabled: boolean };
    /** Extra classNames to apply to iframe element */
    classNames?: string[];
    /** IFrame app identifier */
    id: string;
    /** Popover API controller */
    popover: PopoverController;
    /** Source URL of iframe */
    src: string;
    /** Computed dimensions of iframe */
    dimensions: (state: IFrameState<A>) => Dimensions;
    /** Computed position of iframe */
    position: (iframeRoot: HTMLElement) => Partial<Rect>;
};

type IFrameMessageHandlerOptions = {
    /** Indicates wether a message handler is initiated
     * from a user action for further validation */
    userAction: boolean;
};

export type IFrameEvent<A> =
    | { type: 'open'; state: IFrameState<A> }
    | { type: 'close'; state: IFrameState<A>; options: IFrameCloseOptions }
    | { type: 'destroy' }
    | { type: 'error'; error: unknown };

export interface IFrameApp<A> {
    element: HTMLIFrameElement;
    state: IFrameState<A>;
    close: (options?: IFrameCloseOptions) => void;
    destroy: () => void;
    ensureLoaded: () => Promise<void>;
    ensureReady: () => Promise<void>;
    getPosition: () => IFramePosition;
    init: (port: Runtime.Port, getPayload: () => IFrameInitPayload) => void;
    open: (action: A, scrollRef?: HTMLElement) => void;
    registerMessageHandler: <M extends IFrameMessage['type']>(
        type: M,
        handler: IFramePortMessageHandler<M>,
        options?: IFrameMessageHandlerOptions
    ) => void;
    sendPortMessage: (message: IFrameMessage) => void;
    setPosition: (coords: Coords) => void;
    subscribe: (subscribe: Subscriber<IFrameEvent<A>>) => () => void;
    updatePosition: () => void;
}

export type IFrameState<Action> = {
    action: MaybeNull<Action>;
    framePort: MaybeNull<string>;
    loaded: boolean;
    port: MaybeNull<Runtime.Port>;
    position: IFramePosition;
    positionReq: number;
    ready: boolean;
    visible: boolean;
};

export interface IFrameAppService<Options extends { action: any }, Action = Options['action']> {
    close: () => IFrameAppService<Options>;
    destroy: () => void;
    getState: () => IFrameState<Action>;
    init: (port: Runtime.Port, getPayload: () => IFrameInitPayload) => IFrameAppService<Options>;
    open: (options: Options) => IFrameAppService<Options>;
    sendMessage: IFrameApp<Action>['sendPortMessage'];
    subscribe: IFrameApp<Action>['subscribe'];
}

export const createIFrameApp = <A>({
    animation,
    backdrop,
    classNames,
    id,
    popover,
    src,
    position,
    dimensions,
}: CreateIFrameAppOptions<A>): IFrameApp<A> => {
    const portMessageHandlers: Map<IFrameMessageType, IFramePortMessageHandler> = new Map();
    const pubsub = createPubSub<IFrameEvent<A>>();
    const listeners = createListenerStore();
    const activeListeners = createListenerStore();

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

    const iframe = createElement<HTMLIFrameElement>({
        type: 'iframe',
        classNames,
        attributes: { src },
        parent: popover.root.shadowRoot,
    });

    iframe.style.setProperty(`--frame-animation`, animation);

    const checkStale = withContext<() => boolean>((ctx) => Boolean(ctx?.getState().stale));
    const ensureLoaded = () => waitUntil({ check: () => state.loaded, cancel: checkStale }, 50);
    const ensureReady = () => waitUntil({ check: () => state.ready, cancel: checkStale }, 50);

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
        sendMessage.onSuccess(contentScriptMessage({ type: WorkerMessageType.RESOLVE_EXTENSION_KEY }), ({ key }) =>
            ensureLoaded()
                .then(() => {
                    const secureMessage: IFrameMessageWithSender = { ...message, key, sender: 'contentscript' };
                    iframe.contentWindow?.postMessage(secureMessage, src);
                })
                .catch((error) => pubsub.publish({ type: 'error', error }))
        );
    /* In order to communicate with the iframe, we're leveraging
     * the worker's MessageBroker port-forwarding capabilities.
     * This allows by-passing a FF limitation not letting us access
     * the Tabs API in an iframe-injected `web_accessible_resource`
     * to directly open a port with the current tab */
    const sendPortMessage = (rawMessage: IFrameMessage) => {
        const message: IFrameMessageWithSender = { ...rawMessage, sender: 'contentscript' };
        return ensureReady()
            .then(() => state.port?.postMessage(portForwardingMessage(state.framePort!, message)))
            .catch((error) => pubsub.publish({ type: 'error', error }));
    };

    /* As we are now using a single port for the whole content-script,
     * make sure to filter messages not only by type but by sender id */
    const registerMessageHandler: IFrameApp<A>['registerMessageHandler'] = (type, handler, options) => {
        type BoundMessageType = Parameters<typeof handler>[0];

        const safeHandler = (message: Maybe<IFrameMessageWithSender>) => {
            if (message?.type === type && message.sender === id) {
                /** If the message handler is a result of an iframe user-action,
                 * validate the action against potential click-jacking attacks */
                const trusted = !options?.userAction || TopLayerManager.ensureTopLevel(popover.root.customElement);
                if (trusted) handler(message as BoundMessageType);
                else logger.warn(`[IFrame::${id}] Untrusted user action`);
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
        state.positionReq = requestAnimationFrame(() => setIframePosition(position(popover.root.customElement)));
    };

    const close = (options: IFrameCloseOptions = {}) => {
        if (state.visible) {
            cancelAnimationFrame(state.positionReq);
            activeListeners.removeAll();

            popover.close();
            pubsub.publish({ type: 'close', state, options }); /* ⚠️ call before resetting state */

            iframe.classList.remove('visible');
            state.visible = false;
            state.action = null;

            void sendPortMessage({ type: IFramePortMessageType.IFRAME_HIDDEN });
        }
    };

    const open = (action: A, anchor?: HTMLElement) => {
        if (!state.visible) {
            popover.open();
            state.action = action;
            state.visible = true;

            if (anchor) {
                activeListeners.addListener(window, 'resize', updatePosition);
                activeListeners.addListener(window, 'scroll', updatePosition);
                activeListeners.addListener(anchor, 'scroll', updatePosition);
            }

            if (backdrop?.enabled) {
                const onMouseDown = (event: Event) => {
                    const target = event.target as MaybeNull<HTMLElement>;
                    if (!target || !backdrop.exclude?.().includes(target)) {
                        close({ discard: true, refocus: false });
                    }
                };

                activeListeners.addListener(window, 'mousedown', onMouseDown);
            }

            void sendPortMessage({ type: IFramePortMessageType.IFRAME_OPEN });

            iframe.classList.add('visible');
            setIframeDimensions(dimensions(state));
            pubsub.publish({ type: 'open', state });
        }
    };

    const onMessageHandler = (message: unknown) =>
        isIFrameMessage(message) && portMessageHandlers.get(message.type)?.(message);

    /** `IFrameInitPayload` should be resolved once the port has been
     * injected or we could hit a race-condition where the init payload
     * does not reflect the most recent content-script state. */
    const init = async (port: Runtime.Port, getPayload: () => IFrameInitPayload) => {
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
                payload: getPayload(),
            })
        );
    };

    const destroy = () => {
        close({ discard: false, refocus: false });
        pubsub.publish({ type: 'destroy' });

        state.port?.onMessage.removeListener(onMessageHandler);
        safeCall(() => popover.root.shadowRoot.removeChild(iframe))();
        state.port = null;

        pubsub.unsubscribe();
        listeners.removeAll();
        activeListeners.removeAll();
    };

    registerMessageHandler(IFramePortMessageType.IFRAME_CONNECTED, ({ payload: { framePort } }) => {
        state.ready = true;
        state.framePort = framePort;
    });

    registerMessageHandler(IFramePortMessageType.IFRAME_CLOSE, (message) => {
        close(message.payload);
        sendContentScriptTelemetry(TelemetryEventName.ExtensionUsed, {}, { modelVersion: MODEL_VERSION });
    });

    registerMessageHandler(IFramePortMessageType.IFRAME_DIMENSIONS, (message) => {
        const { width, height } = merge(dimensions(state), { height: message.payload.height });
        return setIframeDimensions({ width, height });
    });

    return {
        element: iframe,
        state,
        close,
        destroy,
        ensureLoaded,
        ensureReady,
        getPosition,
        init,
        open,
        registerMessageHandler,
        sendPortMessage,
        setPosition: setIframePosition,
        updatePosition,
        subscribe: pubsub.subscribe,
    };
};
