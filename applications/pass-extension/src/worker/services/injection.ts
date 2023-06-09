import type { Runtime } from 'webextension-polyfill';

import { backgroundMessage } from '@proton/pass/extension/message';
import browser from '@proton/pass/globals/browser';
import type { Maybe } from '@proton/pass/types';
import { type TabId, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import WorkerMessageBroker from '../channel';

const withTabEffect =
    (fn: (tabId: TabId, frameId: Maybe<number>) => Promise<void>) =>
    async (_: any, { tab, frameId }: Runtime.MessageSender) => {
        try {
            await (tab?.id && fn(tab.id, frameId));
            return true;
        } catch (_) {
            /* in case the tab/frameId was discarded we may get an
             * `Receiving end does not exist` error at this point -
             * ignore it as the orchestrator will be re-injected */
            return true;
        }
    };

export const createInjectionService = () => {
    const inject = async (options: {
        tabId: TabId;
        allFrames?: boolean;
        frameId?: Maybe<number>;
        js: string[];
        css?: string[];
    }) => {
        const { tabId } = options;
        const frameIds = options.frameId ? [options.frameId] : undefined;

        Promise.all([
            options.css &&
                browser.scripting.insertCSS({
                    target: { tabId, allFrames: options.allFrames ?? false, frameIds },
                    files: options.css,
                }),
            options.js &&
                browser.scripting.executeScript({
                    target: { tabId, allFrames: options.allFrames ?? false, frameIds },
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
                    /* FIXME: re-inject in all frames when supporting iframes */
                    inject({ tabId: tab.id, allFrames: false, js: ['orchestrator.js'] }).catch(noop);
                }
            })
        );
    };

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.LOAD_CONTENT_SCRIPT,
        withTabEffect((tabId, frameId) => inject({ tabId, frameId, js: ['client.js'], css: ['styles/client.css'] }))
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.UNLOAD_CONTENT_SCRIPT,
        withTabEffect((tabId, frameId) =>
            browser.tabs.sendMessage(tabId, backgroundMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT }), {
                frameId,
            })
        )
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.START_CONTENT_SCRIPT,
        withTabEffect((tabId, frameId) =>
            browser.tabs.sendMessage(tabId, backgroundMessage({ type: WorkerMessageType.START_CONTENT_SCRIPT }), {
                frameId,
            })
        )
    );

    return { updateInjections };
};

export type InjectionService = ReturnType<typeof createInjectionService>;
