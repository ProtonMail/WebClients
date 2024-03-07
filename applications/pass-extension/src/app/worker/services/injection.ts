import { captureMessage as sentryCaptureMessage } from '@sentry/browser';
import type { Runtime } from 'webextension-polyfill';

import { backgroundMessage } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import type { Maybe } from '@proton/pass/types';
import { type TabId, WorkerMessageType } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import WorkerMessageBroker from '../channel';
import { PASS_ELEMENTS_KEY } from '../constants';

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
        world?: 'MAIN' | 'ISOLATED';
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
                    world: options.world as any,
                }),
        ]).catch((e) => {
            console.warn(e);
            logger.info(`[InjectionService::inject] Injection error on tab ${tabId}`, e);
        });
    };

    const updateInjections = async () => {
        const tabs = await browser.tabs.query({ url: ['https://*/*', 'http://*/*'] }).catch(() => []);
        await Promise.all(
            tabs
                .filter((tab) => !tab.url?.includes('pass.proton.'))
                .map(async (tab) => {
                    logger.info(`[InjectionService::update] Re-injecting script on tab ${tab.id}`);
                    if (tab.id !== undefined) {
                        /* FIXME: re-inject in all frames when supporting iframes */
                        // await inject({ tabId: tab.id, allFrames: false, js: ['elements.js'], world: 'MAIN' });
                        await inject({ tabId: tab.id, allFrames: false, js: ['orchestrator.js'] });
                    }
                })
        );
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.REGISTER_ELEMENTS, async (_, { tab }) => {
        const target = { tabId: tab?.id!, allFrames: false };
        const world = 'MAIN' as any;

        const elements: PassElementsConfig = {
            root: `protonpass-root-${uniqueId(4)}`,
            control: `protonpass-control-${uniqueId(4)}`,
        };

        await browser.scripting.executeScript({
            target,
            world,
            args: [{ [PASS_ELEMENTS_KEY]: elements }],
            func: (key) => Object.assign(self, key),
        });

        await browser.scripting.executeScript({ target, world, files: ['elements.js'] });

        return { elements };
    });

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.LOAD_CONTENT_SCRIPT,
        withTabEffect((tabId, frameId) => inject({ tabId, frameId, js: ['client.js'] }))
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

    WorkerMessageBroker.registerMessage(WorkerMessageType.SENTRY_CS_EVENT, ({ payload }) => {
        sentryCaptureMessage(payload.message, { extra: payload });
        return true;
    });

    return { updateInjections };
};

export type InjectionService = ReturnType<typeof createInjectionService>;
