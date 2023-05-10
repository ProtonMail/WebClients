import { backgroundMessage } from '@proton/pass/extension/message';
import browser from '@proton/pass/globals/browser';
import { type TabId, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import { createDevReloader } from '../../shared/extension/dev-reload';
import WorkerMessageBroker from '../channel';

const CSS_FILES = ['styles/content.css'];
const JS_FILES = ['content.js'];

export const createInjectionService = () => {
    const inject = async (options: { tabId: TabId }) => {
        const { tabId } = options;
        Promise.all([
            browser.scripting.insertCSS({ target: { tabId, allFrames: false }, files: CSS_FILES }),
            browser.scripting.executeScript({ target: { tabId, allFrames: false }, files: JS_FILES }),
        ]).catch((e) => logger.info(`[InjectionService::inject] Injection error on tab ${tabId}`, e));
    };

    const updateInjections = async () => {
        WorkerMessageBroker.ports.broadcast(backgroundMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT }));

        const tabs = await browser.tabs.query({ url: ['https://*/*', 'http://*/*'] });
        await Promise.all(
            tabs.map((tab) => {
                logger.info(`[InjectionService::update] Re-injecting script on tab ${tab.id}`);
                if (tab.id !== undefined) {
                    void inject({ tabId: tab.id });
                }
            })
        );
    };

    if (ENV === 'development') {
        if (BUILD_TARGET === 'chrome') void updateInjections();

        createDevReloader(() => {
            WorkerMessageBroker.ports.broadcast(
                backgroundMessage({
                    type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT,
                })
            );
            setTimeout(() => browser.runtime.reload(), 100);
        }, '[DEV] Reloading runtime');
    }

    return { updateInjections };
};

export type InjectionService = ReturnType<typeof createInjectionService>;
