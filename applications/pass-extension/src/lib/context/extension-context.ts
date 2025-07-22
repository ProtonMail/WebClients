import { resolveMessageFactory, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { generatePortName } from 'proton-pass-extension/lib/utils/port';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { Runtime } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { ClientEndpoint, MaybeNull, TabId } from '@proton/pass/types';
import { contextHandlerFactory } from '@proton/pass/utils/context';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { logger } from '@proton/pass/utils/logger';
import type { ParsedUrl } from '@proton/pass/utils/url/types';
import { wait } from '@proton/shared/lib/helpers/promise';

import.meta.webpackHot?.decline();

export type ExtensionContextType = {
    endpoint: ClientEndpoint;
    /** The currently active tab's ID. In popup contexts,
     * represents the focused tab visible to the user. */
    tabId: TabId;
    /** The tab ID that originated the context. Matches `tabId`
     * for content scripts and extension pages, but differs in
     * popup contexts where it represents the popup's source tab. */
    senderTabId: TabId;
    port: Runtime.Port;
    url: MaybeNull<ParsedUrl>;
    destroy: () => void;
};

export type ExtensionContextOptions = {
    endpoint: ClientEndpoint;
    /** Called when extension context setup fails critically,
     * typically during service worker invalidation and the
     * current extension context is invalidated */
    onError?: (error: unknown) => void;
    /** Called with new extension context after successful recycling */
    onRecycle?: (ctx: ExtensionContextType) => void;
    /** Called on port disconnect. Return whether to attempt recycling */
    onDisconnect: () => { recycle: boolean };
};

export const ExtensionContext = contextHandlerFactory<ExtensionContextType>('extension');

export const setupExtensionContext = async (options: ExtensionContextOptions): Promise<ExtensionContextType> => {
    const message = resolveMessageFactory(options.endpoint);
    const logCtx = `Context::Extension::${options.endpoint}`;

    try {
        const {
            tabId = 0,
            senderTabId = 0,
            url = null,
        } = await sendMessage.on(
            message({
                type: WorkerMessageType.TABS_QUERY,
                payload: { current: options.endpoint === 'popup' },
            }),
            (res) => {
                if (res.type === 'error') return { tabId: 0, url: null, senderTabId: 0 };
                return res;
            }
        );

        /** Generate a unique port name by combining the endpoint and sender tab ID.
         * This ensures requests are properly associated with their originating tab context */
        const name = generatePortName(options.endpoint, senderTabId);
        const port = browser.runtime.connect(browser.runtime.id, { name });

        logger.info(`[${logCtx}] tabId resolved & port opened`);

        const onPortDisconnect = async () => {
            const { recycle } = options.onDisconnect();
            logger.info(`[${logCtx}] port disconnected [reconnect=${recycle}]`);

            if (recycle) {
                try {
                    /** When disconnection is triggered by the service worker unregistering,
                     * we need to allow time for the new service worker to fully claim the
                     * current extension runtime before proceeding. Without this delay, runtime
                     * API calls during context setup may fail with "receiving end does not exist"
                     * errors when trying to communicate with the incoming service worker. */
                    await wait(250);

                    const ctx = await setupExtensionContext(options);
                    return options.onRecycle?.(ctx);
                } catch {
                    logger.info(`[${logCtx}] Recycling context failed`);
                }
            }
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

        return ExtensionContext.set({ endpoint: options.endpoint, port, tabId, senderTabId, url, destroy });
    } catch (error) {
        logger.info(`[${logCtx}] fatal error`, error);

        ExtensionContext.clear();
        options.onError?.(error);

        throw error;
    }
};
