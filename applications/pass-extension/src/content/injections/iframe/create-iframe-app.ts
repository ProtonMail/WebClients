import type { Runtime } from 'webextension-polyfill';

import { portForwardingMessage } from '@proton/pass/extension/message';
import type { Maybe, MaybeNull, WorkerState } from '@proton/pass/types';
import { createElement, pixelEncoder } from '@proton/pass/utils/dom';
import { safeCall, waitUntil } from '@proton/pass/utils/fp';
import { createListenerStore } from '@proton/pass/utils/listener';
import { merge } from '@proton/pass/utils/object';

import { EXTENSION_PREFIX } from '../../constants';
import type {
    IFrameApp,
    IFrameEndpoint,
    IFrameMessageWithSender,
    IFramePortMessageHandler,
    IFrameState,
} from '../../types/iframe';
import { type IFrameMessage, IFrameMessageType } from '../../types/iframe';
import { createIframeRoot } from './create-iframe-root';

import './iframe.scss';

export type IframePosition = { top: number; left?: number; right?: number; zIndex?: number };
export type IframeDimensions = { width: number; height: number };

type CreateIFrameAppOptions = {
    id: IFrameEndpoint;
    src: string;
    animation: 'slidein' | 'fadein';
    classNames?: string[];
    backdropClose: boolean;
    backdropExclude?: () => HTMLElement[];
    onReady?: () => void;
    onOpen?: () => void;
    onClose?: (options: { userInitiated: boolean }) => void;
    getIframePosition: (iframeRoot: HTMLDivElement) => IframePosition;
    getIframeDimensions: () => IframeDimensions;
};

export const createIFrameApp = ({
    id,
    src,
    animation,
    classNames = [],
    backdropClose,
    backdropExclude,
    onOpen,
    onClose,
    getIframePosition,
    getIframeDimensions,
}: CreateIFrameAppOptions): IFrameApp => {
    const iframeRoot = createIframeRoot();
    const portMessageHandlers: Map<IFrameMessageType, IFramePortMessageHandler> = new Map();

    const state: IFrameState = {
        visible: false,
        ready: false,
        loaded: false,
        port: null,
        framePort: null,
    };

    const listeners = createListenerStore();

    const iframe = createElement<HTMLIFrameElement>({
        type: 'iframe',
        classNames: [`${EXTENSION_PREFIX}-iframe`, ...classNames],
        attributes: { src },
        parent: iframeRoot,
    });

    iframe.style.setProperty(`--${EXTENSION_PREFIX}-iframe-animation`, animation);
    iframe.addEventListener('load', () => (state.loaded = true), { once: true });

    /* Securing the posted message's allowed target origins.
     * Ensure the iframe has been correctly loaded before sending
     * out any message: the iframe.contentWindow::origin may be
     * incorrect otherwise */
    const sendPostMessage = (rawMessage: IFrameMessage) => {
        const message: IFrameMessageWithSender = { ...rawMessage, sender: 'content-script' };
        void waitUntil(() => state.loaded, 100).then(() => iframe.contentWindow?.postMessage(message, iframe.src));
    };

    /* In order to communicate with the iframe, we're leveraging
     * the worker's MessageBroker port-forwarding capabilities.
     * This allows by-passing a FF limitation not letting us access
     * the Tabs API in an iframe-injected `web_accessible_resource`
     * to directly open a port with the current tab */
    const sendPortMessage = (rawMessage: IFrameMessage) => {
        const message: IFrameMessageWithSender = { ...rawMessage, sender: 'content-script' };
        void waitUntil(() => state.ready, 100).then(() =>
            state.port?.postMessage(portForwardingMessage(state.framePort!, message))
        );
    };

    /* As we are now using a single port for the whole content-script,
     * make sure to filter messages not only by type but by sender id */
    const registerMessageHandler = <M extends IFrameMessageType>(
        type: M,
        handler: (message: IFrameMessageWithSender<M>) => void
    ) => {
        const safeHandler = (message: Maybe<IFrameMessageWithSender>) =>
            message?.type === type && message.sender === id && handler(message as IFrameMessageWithSender<M>);

        portMessageHandlers.set(type, safeHandler);
        return () => portMessageHandlers.delete(type);
    };

    const setIframePosition = ({ top, left, right, zIndex }: IframePosition) => {
        iframe.style.setProperty(`--${EXTENSION_PREFIX}-iframe-zindex`, `${zIndex ?? 1}`);
        iframe.style.setProperty(`--${EXTENSION_PREFIX}-iframe-top`, pixelEncoder(top));
        iframe.style.setProperty(`--${EXTENSION_PREFIX}-iframe-left`, left ? pixelEncoder(left) : 'unset');
        iframe.style.setProperty(`--${EXTENSION_PREFIX}-iframe-right`, right ? pixelEncoder(right) : 'unset');
    };

    const setIframeDimensions = ({ width, height }: IframeDimensions) => {
        iframe.style.setProperty(`--${EXTENSION_PREFIX}-iframe-width`, pixelEncoder(width));
        iframe.style.setProperty(`--${EXTENSION_PREFIX}-iframe-height`, pixelEncoder(height));
    };

    const positionDropdown = () => setIframePosition(getIframePosition(iframeRoot));

    const close = (options?: { event?: Event; userInitiated: boolean }) =>
        requestAnimationFrame(() => {
            if (state.visible) {
                const target = options?.event?.target as Maybe<MaybeNull<HTMLElement>>;

                if (!target || !backdropExclude?.().includes(target)) {
                    listeners.removeAll();
                    state.visible = false;
                    onClose?.({ userInitiated: options?.userInitiated ?? true });

                    iframe.classList.remove(`${EXTENSION_PREFIX}-iframe-visible`);
                }
            }
        });

    const open = (scrollRef?: HTMLElement) => {
        requestAnimationFrame(() => {
            if (!state.visible) {
                state.visible = true;
                iframe.classList.add(`${EXTENSION_PREFIX}-iframe-visible`);

                setIframeDimensions(getIframeDimensions());
                positionDropdown();

                listeners.addListener(window, 'resize', positionDropdown);
                listeners.addListener(scrollRef, 'scroll', () => requestAnimationFrame(positionDropdown));

                if (backdropClose) {
                    listeners.addListener(window, 'mousedown', (event) => close({ event, userInitiated: true }));
                }

                sendPortMessage({ type: IFrameMessageType.IFRAME_OPEN });
                onOpen?.();
            }
        });
    };

    const init = (port: Runtime.Port) => {
        sendPostMessage({
            type: IFrameMessageType.IFRAME_INJECT_PORT,
            payload: { port: port.name },
        });

        state.port = port;
        state.port.onMessage.addListener(
            (message: Maybe<IFrameMessageWithSender>) =>
                message && message?.type !== undefined && portMessageHandlers.get(message.type)?.(message)
        );
    };

    const reset = (workerState: WorkerState) => {
        sendPortMessage({ type: IFrameMessageType.IFRAME_INIT, payload: { workerState } });
        close({ userInitiated: false });
    };

    const destroy = () => {
        listeners.removeAll();
        safeCall(() => iframeRoot.removeChild(iframe))();
        safeCall(state?.port?.disconnect)();
        state.port = null;
    };

    registerMessageHandler(IFrameMessageType.IFRAME_CONNECTED, ({ payload: { framePort } }) => {
        state.ready = true;
        state.framePort = framePort;
    });

    registerMessageHandler(IFrameMessageType.IFRAME_CLOSE, () => close({ userInitiated: true }));

    registerMessageHandler(IFrameMessageType.IFRAME_DIMENSIONS, (message) => {
        const { width, height } = merge(getIframeDimensions(), { height: message.payload.height });
        return setIframeDimensions({ width, height });
    });

    return {
        element: iframe,
        state,
        sendPostMessage,
        sendPortMessage,
        registerMessageHandler,
        reset,
        open,
        close,
        destroy,
        init,
    };
};
