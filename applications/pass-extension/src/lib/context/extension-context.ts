import { resolveMessageFactory, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { generatePortName } from 'proton-pass-extension/lib/utils/port';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { Runtime } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { ClientEndpoint, EndpointContext, FrameId, MaybeNull, TabId } from '@proton/pass/types';
import { contextHandlerFactory } from '@proton/pass/utils/context';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { logger } from '@proton/pass/utils/logger';
import type { ParsedUrl } from '@proton/pass/utils/url/types';

import.meta.webpackHot?.decline();

export type ExtensionContextType = {
    endpoint: ClientEndpoint;
    /** The currently active tab's ID. In popup contexts,
     * represents the focused tab visible to the user. */
    tabId: TabId;
    frameId: FrameId;
    /** The tab ID that originated the context. Matches `tabId`
     * for content scripts and extension pages, but differs in
     * popup contexts where it represents the popup's source tab. */
    senderTabId: TabId;
    port: Runtime.Port;
    url: MaybeNull<ParsedUrl>;
    tabUrl: MaybeNull<ParsedUrl>;
    destroy: () => void;
};

export type ExtensionContextOptions = {
    endpoint: ClientEndpoint;
    /** Called when extension context setup fails critically,
     * typically during service worker invalidation and the
     * current extension context is invalidated */
    onError?: (error: unknown) => void;
    /** Called on port disconnect. */
    onDisconnect: () => void;
};

export const ExtensionContext = contextHandlerFactory<ExtensionContextType>('extension');

export const setupExtensionContext = async (options: ExtensionContextOptions): Promise<ExtensionContextType> => {
    const { endpoint } = options;
    const message = resolveMessageFactory(endpoint);
    const logCtx = `Context::Extension::${endpoint}`;

    try {
        const res = await sendMessage.on(
            message({ type: WorkerMessageType.ENDPOINT_INIT, payload: { popup: endpoint === 'popup' } }),
            (res): Partial<EndpointContext> => {
                if (res.type === 'error') return {};
                return res;
            }
        );

        const { tabId = 0, senderTabId = 0, url = null, tabUrl = null, frameId = 0 } = res;
        /** Generate a unique port name by combining the endpoint and sender tab ID.
         * This ensures requests are properly associated with their originating tab context */
        const name = generatePortName(endpoint, senderTabId, frameId);
        const port = browser.runtime.connect(browser.runtime.id, { name });

        logger.info(`[${logCtx}] tabId resolved & port opened`);

        /** NOTE: When disconnection is triggered by the service worker unregistering,
         * the caller should handle reconnection timing to avoid "receiving end does
         * not exist" errors when communicating with the incoming service worker. */
        const onPortDisconnect = async () => {
            logger.info(`[${logCtx}] port disconnected`);
            options.onDisconnect();
        };

        const disconnectPort = safeCall(() => port.disconnect());

        const destroy = pipe(
            /** Safari fires disconnect events on self-initiated disconnections,
             * Chrome/Firefox don't. Remove listener before disconnecting. */
            () => port.onDisconnect.removeListener(onPortDisconnect),
            disconnectPort,
            ExtensionContext.clear
        );

        port.onDisconnect.addListener(onPortDisconnect);

        return ExtensionContext.set({ endpoint, port, frameId, senderTabId, tabId, tabUrl, url, destroy });
    } catch (error) {
        logger.info(`[${logCtx}] fatal error`, error);

        ExtensionContext.clear();
        options.onError?.(error);

        throw error;
    }
};
