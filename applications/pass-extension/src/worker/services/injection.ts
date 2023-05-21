import type { Runtime } from 'webextension-polyfill';

import { backgroundMessage } from '@proton/pass/extension/message';
import browser from '@proton/pass/globals/browser';
import { type TabId, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import { createDevReloader } from '../../shared/extension/dev-reload';
import WorkerMessageBroker from '../channel';

const withTabEffect =
    (fn: (tabId: TabId) => Promise<void>) =>
    async (_: any, { tab }: Runtime.MessageSender) => {
        if (!tab?.id) return false;
        await fn(tab.id);
        return true;
    };

export const createInjectionService = () => {
    const inject = async (options: { tabId: TabId; js: string[]; css?: string[] }) => {
        const { tabId } = options;
        Promise.all([
            options.css && browser.scripting.insertCSS({ target: { tabId, allFrames: false }, files: options.css }),
            options.js &&
                browser.scripting.executeScript({
                    target: { tabId, allFrames: false },
                    files: options.js,
                }),
        ]).catch((e) => logger.info(`[InjectionService::inject] Injection error on tab ${tabId}`, e));
    };

    const updateInjections = async () => {
        const tabs = await browser.tabs.query({ url: ['https://*/*', 'http://*/*'] });
        await Promise.all(
            tabs.map((tab) => {
                logger.info(`[InjectionService::update] Re-injecting script on tab ${tab.id}`);
                if (tab.id !== undefined) {
                    void inject({ tabId: tab.id, js: ['orchestrator.js'] });
                }
            })
        );
    };

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.LOAD_CONTENT_SCRIPT,
        withTabEffect((tabId) => inject({ tabId, js: ['client.js'], css: ['styles/client.css'] }))
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.UNLOAD_CONTENT_SCRIPT,
        withTabEffect((tabId) =>
            browser.tabs.sendMessage(tabId, backgroundMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT }))
        )
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.START_CONTENT_SCRIPT,
        withTabEffect((tabId) =>
            browser.tabs.sendMessage(tabId, backgroundMessage({ type: WorkerMessageType.START_CONTENT_SCRIPT }))
        )
    );

    if (ENV === 'development') {
        createDevReloader(() => setTimeout(() => browser.runtime.reload(), 500), '[DEV] Reloading runtime');
    }

    return { updateInjections };
};

export type InjectionService = ReturnType<typeof createInjectionService>;
