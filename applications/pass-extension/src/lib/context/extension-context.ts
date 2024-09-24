import { generatePortName } from 'proton-pass-extension/lib/utils/port';
import type { Runtime } from 'webextension-polyfill';

import { resolveMessageFactory, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import browser from '@proton/pass/lib/globals/browser';
import type { ClientEndpoint, MaybeNull, TabId } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { contextHandlerFactory } from '@proton/pass/utils/context';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { logger, registerLoggerEffect } from '@proton/pass/utils/logger';
import type { ParsedUrl } from '@proton/pass/utils/url/types';

import.meta.webpackHot?.decline();

export type ExtensionContextType = {
    endpoint: ClientEndpoint;
    tabId: TabId;
    port: Runtime.Port;
    url: MaybeNull<ParsedUrl>;
    destroy: () => void;
};

export type ExtensionContextOptions = {
    endpoint: ClientEndpoint;
    onDisconnect: (previousCtx?: ExtensionContextType) => { recycle: boolean };
    onRecycle: (nextCtx: ExtensionContextType) => void;
};

export const ExtensionContext = contextHandlerFactory<ExtensionContextType>('extension');

export const setupExtensionContext = async (options: ExtensionContextOptions): Promise<ExtensionContextType> => {
    const { endpoint, onDisconnect, onRecycle } = options;
    const message = resolveMessageFactory(endpoint);

    try {
        const { tabId, url } = await sendMessage.on(
            message({ type: WorkerMessageType.TABS_QUERY, payload: { current: endpoint === 'popup' } }),
            (res) => {
                if (res.type === 'error') return { tabId: -1, url: null };
                return { tabId: res.tabId, url: res.url };
            }
        );

        const name = generatePortName(endpoint, tabId);
        const port = browser.runtime.connect(browser.runtime.id, { name });
        const disconnectPort = safeCall(() => port.disconnect());
        const destroy = pipe(disconnectPort, ExtensionContext.clear);
        const ctx = ExtensionContext.set({ endpoint, port, tabId, url, destroy });

        ctx.port.onDisconnect.addListener(async () => {
            logger.info('[Context::Extension] port disconnected - reconnecting');
            const { recycle } = onDisconnect?.(ExtensionContext.read());
            return recycle && onRecycle(await setupExtensionContext(options));
        });

        registerLoggerEffect((...logs) =>
            sendMessage(
                resolveMessageFactory(endpoint)({
                    type: WorkerMessageType.LOG_EVENT,
                    payload: { log: logs.join(' ') },
                })
            )
        );

        logger.info('[Context::Extension] tabId resolved & port opened');
        return ctx;
    } catch (e) {
        logger.warn('[Context::Extension]', e);
        throw new Error('Initalization failed');
    }
};
