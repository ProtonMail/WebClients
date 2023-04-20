import uniqid from 'uniqid';
import type { Runtime } from 'webextension-polyfill';

import { resolveMessageFactory, sendMessage } from '@proton/pass/extension/message';
import { getCurrentTab } from '@proton/pass/extension/tabs';
import browser from '@proton/pass/globals/browser';
import { type ExtensionEndpoint, type Realm, type TabId, WorkerMessageType } from '@proton/pass/types';
import { createSharedContext } from '@proton/pass/utils/context';
import { logger } from '@proton/pass/utils/logger';
import { parseUrl } from '@proton/pass/utils/url';

export type ExtensionContextType = {
    endpoint: ExtensionEndpoint;
    tabId: TabId;
    port: Runtime.Port;
    realm: Realm | null;
    subdomain: string | null;
};

export type ExtensionContextOptions = {
    endpoint: ExtensionEndpoint;
    onDisconnect?: (previousCtx: ExtensionContextType) => void;
    onContextChange?: (nextCtx: ExtensionContextType) => void;
};

export const ExtensionContext = createSharedContext<ExtensionContextType>('extension');

export const setupExtensionContext = async (options: ExtensionContextOptions): Promise<ExtensionContextType> => {
    const { endpoint, onDisconnect, onContextChange } = options;

    try {
        const tab = await getCurrentTab();
        if (tab !== undefined && tab.id !== undefined) {
            const { domain, subdomain } = parseUrl(tab.url ?? '');
            const name = `${endpoint}-${tab.id}-${uniqid()}`;

            const ctx = ExtensionContext.set({
                endpoint,
                port: browser.runtime.connect(browser.runtime.id, { name }),
                tabId: tab.id,
                realm: domain!,
                subdomain,
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
                onDisconnect?.(ExtensionContext.get());
                onContextChange?.(await setupExtensionContext(options));
            });

            return ctx;
        }

        throw new Error('Invalid runtime');
    } catch (e) {
        logger.warn('[Context::Extension]', e);
        throw new Error('Initalization failed');
    }
};
