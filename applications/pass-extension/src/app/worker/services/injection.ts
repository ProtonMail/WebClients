import { captureMessage as sentryCaptureMessage } from '@sentry/browser';
import type { Runtime } from 'webextension-polyfill';

import { backgroundMessage } from '@proton/pass/lib/extension/message/send-message';
import browser from '@proton/pass/lib/globals/browser';
import type { Maybe } from '@proton/pass/types';
import { type TabId, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

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
        ]).catch((e) => logger.info(`[InjectionService::inject] Injection error on tab ${tabId}`, e));
    };

    const updateInjections = async () => {
        if (BUILD_TARGET === 'chrome') {
            const tabs = await browser.tabs.query({ url: ['https://*/*', 'http://*/*'] }).catch(() => []);

            await Promise.all(
                tabs
                    .filter((tab) => !tab.url?.includes('pass.proton.'))
                    .map(async (tab) => {
                        logger.info(`[InjectionService::update] Re-injecting script on tab ${tab.id}`);
                        if (tab.id !== undefined) {
                            /* FIXME: re-inject in all frames when supporting iframes */
                            await inject({ tabId: tab.id, allFrames: false, js: ['orchestrator.js'] });
                        }
                    })
            );
        }
    };

    /** Define the tag names for custom elements upon each `REGISTER_ELEMENTS`
     * request. This ensures that each tab can re-register these elements if a
     * content-script is re-injected due to events like extension updates or hot
     * -reloads. This re-registration is necessary because custom elements cannot
     * be updated once defined. A random tag name is used to avoid collisions.*/
    WorkerMessageBroker.registerMessage(WorkerMessageType.REGISTER_ELEMENTS, async (_, { tab }) => {
        const hash = uniqueId(4);

        const scriptConfig = {
            target: { tabId: tab?.id!, allFrames: false },
            world: (BUILD_TARGET === 'chrome' || BUILD_TARGET === 'safari' ? 'MAIN' : undefined) as any,
        };

        if (BUILD_TARGET === 'chrome' || BUILD_TARGET === 'safari') {
            /** In Chrome, we can directly register custom elements via injection in the MAIN
             * world. Firefox isolates custom elements from this realm, which can have unintended
             * side effects in page-scripts. For Firefox, we leverage the injected script trick.
             * See `applications/pass-extension/src/app/content/client.ts` for details */
            await browser.scripting.executeScript({ ...scriptConfig, files: ['elements.js'] });
        }

        await browser.scripting.executeScript({
            ...scriptConfig,
            args: [hash],
            func: (hash: string) => {
                /** In Firefox, content scripts need to use `window.wrappedJSObject`
                 * to see the "expando" properties defined on the global object */
                const self = window?.wrappedJSObject ?? window;
                self.registerPassElements?.(hash);
            },
        });

        return { hash };
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
