import type { Runtime } from 'webextension-polyfill';

import { resolveMessageFactory, sendMessage } from '@proton/pass/extension/message';
import { getCurrentTab } from '@proton/pass/extension/tabs';
import browser from '@proton/pass/globals/browser';
import { type ExtensionEndpoint, type TabId, WorkerMessageType } from '@proton/pass/types';
import { createSharedContext } from '@proton/pass/utils/context';
import { safeCall } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import type { ParsedUrl } from '@proton/pass/utils/url';
import { parseUrl } from '@proton/pass/utils/url';

import { generatePortName } from './port';

export type ExtensionContextType = {
    endpoint: ExtensionEndpoint;
    tabId: TabId;
    port: Runtime.Port;
    url: ParsedUrl;
    destroy: () => void;
};

export type ExtensionContextOptions = {
    endpoint: ExtensionEndpoint;
    onDisconnect: (previousCtx?: ExtensionContextType) => { recycle: boolean };
    onRecycle: (nextCtx: ExtensionContextType) => void;
};

export const ExtensionContext = createSharedContext<ExtensionContextType>('extension');

export const setupExtensionContext = async (options: ExtensionContextOptions): Promise<ExtensionContextType> => {
    const { endpoint, onDisconnect, onRecycle } = options;
    try {
        const tab = await getCurrentTab();
        if (tab !== undefined && tab.id !== undefined) {
            const name = generatePortName(endpoint, tab.id);
            const port = browser.runtime.connect(browser.runtime.id, { name });

            const ctx = ExtensionContext.set({
                endpoint,
                port,
                tabId: tab.id,
                url: parseUrl(tab.url ?? ''),
                destroy: () => {
                    safeCall(() => port.disconnect())();
                    ExtensionContext.clear();
                },
            });

            logger.setLogOptions({
                onLog: (log, originalLog) => {
                    void sendMessage(
                        resolveMessageFactory(endpoint)({
                            type: WorkerMessageType.LOG_EVENT,
                            payload: { log },
                        })
                    );
                    return ENV === 'development' && originalLog(log);
                },
            });

            logger.info('[Context::Extension] tabId resolved & port opened');

            ctx.port.onDisconnect.addListener(async () => {
                logger.info('[Context::Extension] port disconnected - reconnecting');
                const { recycle } = onDisconnect?.(ExtensionContext.read());
                return recycle && onRecycle(await setupExtensionContext(options));
            });

            return ctx;
        }

        throw new Error('Invalid runtime');
    } catch (e) {
        logger.warn('[Context::Extension]', e);
        throw new Error('Initalization failed');
    }
};
