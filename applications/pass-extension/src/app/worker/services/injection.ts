import { captureMessage as sentryCaptureMessage } from '@sentry/browser';
import { isFirefoxMainWorldInjectionSupported } from 'proton-pass-extension/app/content/firefox/version';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import type { MessageHandlerCallback } from 'proton-pass-extension/lib/message/message-broker';
import { withSender } from 'proton-pass-extension/lib/message/message-broker';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { resolveEndpointContext } from 'proton-pass-extension/lib/utils/endpoint';
import { computeFeatures, shouldInjectContentScript } from 'proton-pass-extension/lib/utils/features';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { Runtime } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { FrameId, Maybe, TabId } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

const withTabEffect =
    (fn: (tabId: TabId, frameId: Maybe<FrameId>) => Promise<void>) =>
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

export const createContentScriptService = () => {
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

    const updateScripts = async () => {
        if (BUILD_TARGET === 'chrome') {
            const tabs = await browser.tabs.query({ url: ['https://*/*', 'http://*/*'] }).catch(() => []);

            await Promise.all(
                tabs.map(async (tab) => {
                    logger.info(`[InjectionService::update] Re-injecting script on tab ${tab.id}`);
                    if (tab.id !== undefined) await inject({ tabId: tab.id, allFrames: true, js: ['orchestrator.js'] });
                })
            );
        }
    };

    const registerElements = async (hash: string, tabId: TabId, frameId: FrameId) => {
        await browser.scripting.executeScript({
            target: { tabId, frameIds: [frameId] },
            world: 'MAIN',
            args: [hash, frameId === 0],
            func: (hash: string, mainFrame: boolean) => {
                /** In Firefox, content scripts need to use `window.wrappedJSObject`
                 * to see the "expando" properties defined on the global object */
                const self = window?.wrappedJSObject ?? window;
                self.registerPassElements?.(hash, mainFrame);
            },
        });

        return true;
    };

    /** Define the tag names for custom elements upon each `REGISTER_ELEMENTS`
     * request. This ensures that each tab can re-register these elements if a
     * content-script is re-injected due to events like extension updates or hot
     * -reloads. This re-registration is necessary because custom elements cannot
     * be updated once defined. A random tag name is used to avoid collisions.*/
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.REGISTER_ELEMENTS,
        withSender(async (_, tabId, frameId) => {
            const hash = uniqueId(4);
            let scriptFallback = false;

            /** Chrome and Safari support MAIN world injection. Firefox versions ≥128 also support
             * MAIN world injection. For older Firefox versions that isolate custom elements from
             * this realm (causing unintended side effects), we fall back to the script injection
             * technique. See `content/services/inline/custom-elements/register.ts` for details */
            if (BUILD_TARGET !== 'firefox' || (await isFirefoxMainWorldInjectionSupported())) {
                await browser.scripting.executeScript({
                    target: { tabId, frameIds: [frameId] },
                    world: 'MAIN',
                    files: ['elements.js'],
                });
                await registerElements(hash, tabId, frameId);
            } else scriptFallback = true;

            return { hash, scriptFallback };
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.REGISTER_ELEMENTS_FALLBACK,
        withSender(async ({ payload }, tabId, frameId) => registerElements(payload.hash, tabId, frameId))
    );

    const loadContentScript: MessageHandlerCallback<WorkerMessageType.LOAD_CONTENT_SCRIPT> = withContext(
        async (ctx, _, sender) => {
            try {
                if (sender.frameId === undefined) return true;
                if (sender.frameId > 0 && !(await ctx.service.autofill.iframeAutofillEnabled())) return true;

                const { tabId, frameId, url, tabUrl } = await resolveEndpointContext(sender.tab, sender.frameId);

                const settings = await ctx.service.settings.resolve();
                const features = computeFeatures(settings, url, tabUrl);
                if (!shouldInjectContentScript(features)) return true;

                await inject({ tabId, frameId, js: ['client.js'] });
                return true;
            } catch {
                return true;
            }
        }
    );

    const unloadContentScript = withTabEffect((tabId, frameId) => {
        const message = backgroundMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT });
        return browser.tabs.sendMessage(tabId, message, { frameId });
    });

    WorkerMessageBroker.registerMessage(WorkerMessageType.LOAD_CONTENT_SCRIPT, loadContentScript);
    WorkerMessageBroker.registerMessage(WorkerMessageType.UNLOAD_CONTENT_SCRIPT, unloadContentScript);
    WorkerMessageBroker.registerMessage(WorkerMessageType.SENTRY_CS_EVENT, ({ payload }) => {
        sentryCaptureMessage(payload.message, { extra: payload });
        return true;
    });

    return { updateScripts };
};

export type ContentScriptService = ReturnType<typeof createContentScriptService>;
