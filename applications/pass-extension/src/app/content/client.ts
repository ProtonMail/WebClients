/** Main entry point for the client content-script lifecycle orchestration. Creates a unique
 * client ID to manage a `ContentScriptClientService` instance that is dynamically loaded and
 * unloaded based on tab visibility. The client internally manages cleanup of any in-progress
 * operations during destruction, making it safe to destroy at any point in its lifecycle.
 *
 * The content-script client is created when a tab becomes visible and destroyed when hidden.
 * This cycle properly handles browser back-forward cache (BFCache) tab restoration and supports
 * clean unloading via the browser tab API during extension updates or dev-mode hot-reloading.
 *
 * Performance is optimized by freeing resources in inactive tabs through complete client
 * destruction on tab hiding. A continuous activity probe ensures connection health with the
 * service worker through periodic pings for long-running tabs. */
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { matchExtensionMessage } from 'proton-pass-extension/lib/message/utils';
import 'proton-pass-extension/lib/utils/polyfills';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { Runtime } from 'webextension-polyfill';

import { FormType } from '@proton/pass/fathom';
import browser from '@proton/pass/lib/globals/browser';
import type { MaybeNull } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { isMainFrame } from '@proton/pass/utils/dom/is-main-frame';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { registerLoggerEffect } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { createActivityProbe } from '@proton/pass/utils/time/probe';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

import { ProtonPassControl } from './injections/custom-elements/ProtonPassControl';
import { ProtonPassRoot } from './injections/custom-elements/ProtonPassRoot';
import type { ContentScriptClientService } from './services/script';
import { createContentScriptClient } from './services/script';

type CustomElementsRegister = () => Promise<PassElementsConfig>;

const scriptId = uniqueId(16);
const mainFrame = isMainFrame();

/** Due to Firefox's limitations in supporting custom elements with content-scripts
 * without disrupting interaction with the injected web page, we employ a workaround :
 * We inject `elements.js` via a script tag to prevent custom elements registration
 * in a privileged realm. Monitor these issues for potential resolution:
 * - https://bugzilla.mozilla.org/show_bug.cgi?id=1492002
 * - https://bugzilla.mozilla.org/show_bug.cgi?id=1836269
 *
 * See: `applications/pass-extension/src/app/worker/services/injection.ts` for injection
 * specifics. For Chromium builds, `elements.js` will be injected in the MAIN world to
 * effectively register the custom elements in a non-isolated realm. */
const registerCustomElements: CustomElementsRegister = async () => {
    if (BUILD_TARGET === 'firefox') {
        await new Promise<void>((resolve, reject) => {
            const listeners = createListenerStore();

            const script = document.createElement('script');
            script.src = browser.runtime.getURL('elements.js');

            const destroy = () => {
                listeners.removeAll();
                script.remove();
            };

            listeners.addListener(script, 'load', () => resolve(destroy()));
            listeners.addListener(script, 'error', () => reject(destroy()));
            (document.head || document.documentElement).appendChild(script);
        });
    }

    const result = await sendMessage(contentScriptMessage({ type: WorkerMessageType.REGISTER_ELEMENTS }));
    if (result.type === 'error') throw new Error('Custom elements registration failure');

    const root = ProtonPassRoot.getTagName(result.hash);
    const control = ProtonPassControl.getTagName(result.hash);
    return { root, control };
};

const createClientController = (elements: PassElementsConfig) => {
    const controller = {
        instance: null as MaybeNull<ContentScriptClientService>,
        probe: createActivityProbe(),
        listeners: createListenerStore(),

        /** Debounced with trailing-only execution to coalesce rapid tab switches.
         * The 350ms delay with trailing: true ensures final visibility state is
         * captured while preventing thrashing during quick changes in Safari. */
        startClient: debounce(
            async () => {
                if (!controller.instance) {
                    controller.instance = createContentScriptClient({
                        scriptId,
                        mainFrame,
                        elements,
                        onError: controller.destroyClient,
                    });

                    controller.probe.start(
                        () => sendMessage(contentScriptMessage({ type: WorkerMessageType.PING })),
                        25_000
                    );

                    return controller.instance.start();
                }
            },
            350,
            { leading: false, trailing: true }
        ),

        stopClient: (reason: string) => {
            controller.probe.cancel();
            controller.startClient.cancel();
            controller.instance?.destroy({ reason });
            controller.instance = null;
        },

        /** Stops the client and removes all listeners. Once called
         * called, the current controller can no longer be re-used. */
        destroyClient: (err?: unknown) => {
            const reason = err instanceof Error ? err.message : err;
            controller.stopClient(String(reason ?? 'destroyed'));
            controller.listeners.removeAll();
            browser.runtime.onMessage.removeListener(controller.onMessage);
        },

        onMessage: withContext<Runtime.OnMessageListener>((ctx, message, _, sendResponse) => {
            if (matchExtensionMessage(message, { sender: 'background' })) {
                switch (message.type) {
                    case WorkerMessageType.UNLOAD_CONTENT_SCRIPT:
                        controller.destroyClient('unload');
                        break;
                }
            }

            if (matchExtensionMessage(message, { type: WorkerMessageType.AUTOFILL_CHECK_FORM, sender: 'background' })) {
                const trackedForms = ctx?.service.formManager.getTrackedForms();
                const hasLoginForm = trackedForms?.some(({ formType }) => formType === FormType.LOGIN);

                sendResponse({ hasLoginForm });
                return true;
            }

            return undefined as any; /* non-blocking handler */
        }),
    };

    browser.runtime.onMessage.addListener(controller.onMessage);

    controller.listeners.addListener(document, 'visibilitychange', () => {
        switch (document.visibilityState) {
            case 'visible':
                return controller.startClient();
            case 'hidden':
                return controller.stopClient('hidden');
        }
    });

    return controller;
};

export const run = async (getCustomElements: CustomElementsRegister) => {
    registerLoggerEffect((...logs) =>
        sendMessage(
            contentScriptMessage({
                type: WorkerMessageType.LOG_EVENT,
                payload: { log: logs.join(' ') },
            })
        )
    );

    const elements = await getCustomElements();
    const controller = createClientController(elements);
    const activePage = document.visibilityState === 'visible';

    if (activePage) {
        /* Start client immediately for active pages by calling and
         * flushing the debounced function with error handling. */
        controller.startClient()?.catch(controller.destroyClient);
        controller.startClient.flush()?.catch(controller.destroyClient);
    }

    return controller;
};

if (ENV !== 'test') run(registerCustomElements).catch(noop);
