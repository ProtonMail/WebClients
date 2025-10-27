import { IFRAME_APP_READY_EVENT } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { sendContentScriptTelemetry } from 'proton-pass-extension/app/content/utils/telemetry';
import {
    contentScriptMessage,
    portForwardingMessage,
    sendMessage,
} from 'proton-pass-extension/lib/message/send-message';
import type { Coords } from 'proton-pass-extension/types/inline';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { Runtime } from 'webextension-polyfill';

import { MODEL_VERSION } from '@proton/pass/constants';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import type { Dimensions, Rect } from '@proton/pass/types/utils/dom';
import { pixelEncoder } from '@proton/pass/utils/dom/computed-styles';
import { createElement } from '@proton/pass/utils/dom/create-element';
import { TopLayerManager } from '@proton/pass/utils/dom/popover';
import { animatePositionChange } from '@proton/pass/utils/dom/position';
import { safeAsyncCall, safeCall } from '@proton/pass/utils/fp/safe-call';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import type { Subscriber } from '@proton/pass/utils/pubsub/factory';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';
import noop from '@proton/utils/noop';

import type {
    IFrameInitPayload,
    IFramePosition,
    InlineCloseOptions,
    InlineMessage,
    InlineMessageType,
    InlineMessageWithSender,
    InlinePortMessageHandler,
} from './inline.messages';
import { InlinePortMessageType, isInlineMessage } from './inline.messages';
import type { PopoverController } from './inline.popover';

type CreateInlineAppOptions<A> = {
    /** Entering animation on visibility toggles */
    animation: 'slidein' | 'fadein';
    /** Extra classNames to apply to iframe element */
    classNames?: string[];
    /** IFrame app identifier */
    id: string;
    /** Popover API controller */
    popover: PopoverController;
    /** Source URL of iframe */
    src: string;
    /** Computed dimensions of iframe */
    dimensions: (state: InlineState<A>) => Dimensions;
    /** Computed position of iframe */
    position: (iframeRoot: HTMLElement) => Partial<Rect>;
};

type InlineMessageHandlerOptions = {
    /** Indicates wether a message handler is initiated
     * from a user action for further validation */
    userAction: boolean;
};

export type InlineEvent<A> =
    | { type: 'open'; state: InlineState<A> }
    | { type: 'close'; state: InlineState<A>; options: InlineCloseOptions }
    | { type: 'destroy' }
    | { type: 'error'; error: unknown };

export interface InlineApp<A> {
    element: HTMLIFrameElement;
    state: InlineState<A>;
    close: (options?: InlineCloseOptions) => void;
    destroy: () => void;
    getPosition: () => IFramePosition;
    init: (port: Runtime.Port, getPayload: () => IFrameInitPayload) => void;
    open: (action: A, prepare?: (ctrl: AbortController) => Promise<boolean>) => Promise<void>;
    registerMessageHandler: <M extends InlineMessage['type']>(
        type: M,
        handler: InlinePortMessageHandler<M>,
        options?: InlineMessageHandlerOptions
    ) => void;
    sendPortMessage: (message: InlineMessage) => void;
    setPosition: (coords: Coords) => void;
    subscribe: (subscribe: Subscriber<InlineEvent<A>>) => () => void;
    updatePosition: () => void;
}

export type InlineState<Action> = {
    /** Active action for inline app */
    action: MaybeNull<Action>;
    /** Abort controller for current inline app request */
    ctrl: MaybeNull<AbortController>;
    /** Port identifier for message forwarding */
    framePort: MaybeNull<string>;
    /** Flag indicating iframe has loaded and is rendered  */
    loaded: boolean;
    /** Extension context port */
    port: MaybeNull<Runtime.Port>;
    /** Position state */
    position: IFramePosition;
    /** Repositioning animation frame request */
    positionReq: number;
    /** Flag indicating iframe is loaded and communication is connected */
    ready: boolean;
    /** Visible state of the frame */
    visible: boolean;
};

export interface InlineAppHandler<Options extends { action: any }, Action = Options['action']> {
    close: (options?: InlineCloseOptions) => void;
    destroy: () => void;
    getState: () => InlineState<Action>;
    init: (port: Runtime.Port, getPayload: () => IFrameInitPayload) => void;
    open: (options: Options) => void;
    sendMessage: InlineApp<Action>['sendPortMessage'];
    subscribe: InlineApp<Action>['subscribe'];
}

export const createInlineApp = <A>({
    animation,
    classNames,
    id,
    popover,
    src,
    position,
    dimensions,
}: CreateInlineAppOptions<A>): InlineApp<A> => {
    const portMessageHandlers: Map<InlineMessageType, InlinePortMessageHandler> = new Map();
    const pubsub = createPubSub<InlineEvent<A>>();
    const listeners = createListenerStore();

    const state: InlineState<A> = {
        action: null,
        ctrl: null,
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
    const ensureReady = () => waitUntil({ check: () => state.ready, cancel: checkStale }, 20);

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
    const sendSecurePostMessage = (message: InlineMessage) =>
        sendMessage.onSuccess(contentScriptMessage({ type: WorkerMessageType.RESOLVE_EXTENSION_KEY }), ({ key }) =>
            ensureLoaded()
                .then(() => {
                    const secureMessage: InlineMessageWithSender = { ...message, key, sender: 'contentscript' };
                    iframe.contentWindow?.postMessage(secureMessage, src);
                })
                .catch((error) => pubsub.publish({ type: 'error', error }))
        );
    /* In order to communicate with the iframe, we're leveraging
     * the worker's MessageBroker port-forwarding capabilities.
     * This allows by-passing a FF limitation not letting us access
     * the Tabs API in an iframe-injected `web_accessible_resource`
     * to directly open a port with the current tab */
    const sendPortMessage = (rawMessage: InlineMessage) => {
        const message: InlineMessageWithSender = { ...rawMessage, sender: 'contentscript' };
        return ensureReady()
            .then(() => state.port?.postMessage(portForwardingMessage(state.framePort!, message)))
            .catch((error) => pubsub.publish({ type: 'error', error }));
    };

    /* As we are now using a single port for the whole content-script,
     * make sure to filter messages not only by type but by sender id */
    const registerMessageHandler: InlineApp<A>['registerMessageHandler'] = (type, handler, options) => {
        type BoundMessageType = Parameters<typeof handler>[0];

        const safeHandler = (message: Maybe<InlineMessageWithSender>) => {
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

    const setIframePosition = (values: IFramePosition) => {
        cancelAnimationFrame(state.positionReq);
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
        animatePositionChange({
            get: () => position(popover.root.customElement),
            set: (rect) => setIframePosition(rect),
            onAnimate: (req) => (state.positionReq = req),
        });
    };

    const close = (options: InlineCloseOptions = {}) => {
        state.ctrl?.abort();
        state.ctrl = null;

        if (state.visible) {
            cancelAnimationFrame(state.positionReq);

            popover.close();
            pubsub.publish({ type: 'close', state, options }); /* ⚠️ call before resetting state */

            iframe.classList.remove('visible');
            state.visible = false;
            state.action = null;

            void sendPortMessage({ type: InlinePortMessageType.IFRAME_HIDDEN });
        }
    };

    /** Inline apps reuse the same iframe instead of creating new ones for each field.
     * Opening requires preparing the iframe and ensuring it's in a ready state before
     * sending action data. This process may be triggered automatically on page load
     * when autofill detection occurs. */
    const open = safeAsyncCall(async (action: A, prepare?: (ctrl: AbortController) => Promise<boolean>) => {
        const ctrl = new AbortController();
        state.ctrl?.abort();
        state.ctrl = ctrl;

        await ensureReady();
        if (ctrl.signal.aborted) return;

        const proceed = prepare ? await prepare(ctrl) : true;
        if (!proceed || ctrl.signal.aborted || state.visible) return;

        popover.open();
        state.action = action;
        state.visible = true;

        void sendPortMessage({ type: InlinePortMessageType.IFRAME_OPEN });

        iframe.classList.add('visible');
        setIframeDimensions(dimensions(state));
        pubsub.publish({ type: 'open', state });
    });

    const onMessageHandler = (message: unknown) =>
        isInlineMessage(message) && portMessageHandlers.get(message.type)?.(message);

    /** `IFrameInitPayload` should be resolved once the port has been
     * injected or we could hit a race-condition where the init payload
     * does not reflect the most recent content-script state. */
    const init = (port: Runtime.Port, getPayload: () => IFrameInitPayload) => {
        state.port?.disconnect();
        state.port = port;
        state.port.onMessage.addListener(onMessageHandler);
        state.port.onDisconnect.addListener(() => (state.ready = false));

        void sendSecurePostMessage({ type: InlinePortMessageType.IFRAME_INJECT_PORT, payload: { port: port.name } })
            .then(() => sendPortMessage({ type: InlinePortMessageType.IFRAME_INIT, payload: getPayload() }))
            .catch(noop);
    };

    const destroy = () => {
        close({ discard: false, refocus: false });
        pubsub.publish({ type: 'destroy' });

        state.port?.onMessage.removeListener(onMessageHandler);
        portMessageHandlers.clear();
        safeCall(() => popover.root.shadowRoot.removeChild(iframe))();
        state.port = null;

        pubsub.unsubscribe();
        listeners.removeAll();
    };

    registerMessageHandler(InlinePortMessageType.IFRAME_CONNECTED, ({ payload: { framePort } }) => {
        state.ready = true;
        state.framePort = framePort;
    });

    registerMessageHandler(InlinePortMessageType.IFRAME_CLOSE, (message) => {
        close(message.payload);
        sendContentScriptTelemetry(TelemetryEventName.ExtensionUsed, {}, { modelVersion: MODEL_VERSION });
    });

    registerMessageHandler(InlinePortMessageType.IFRAME_DIMENSIONS, (message) => {
        const { width, height } = merge(dimensions(state), { height: message.payload.height });
        return setIframeDimensions({ width, height });
    });

    return {
        element: iframe,
        state,
        close,
        destroy,
        getPosition: () => state.position,
        init,
        open,
        registerMessageHandler,
        sendPortMessage,
        setPosition: setIframePosition,
        updatePosition,
        subscribe: pubsub.subscribe,
    };
};
