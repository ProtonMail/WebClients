/* This is the main entry point for the client content-script. It creates a unique
 * client ID and determines whether the script is being loaded in the main frame.
 * If the document is visible, it creates a ContentScriptClientService instance and
 * starts it. It also listens to messages from the background script, and starts or
 * stops the content script accordingly to handle unloading for performance reasons.
 *
 * The orchestrator script handles registering and unregistering tabevent listeners
 * as well as broadcasting messages to other content-scripts running on the same tab.
 * When the background script sends a `START_CONTENT_SCRIPT` message, the entry point
 * creates a new `ContentScriptClientService` instance if one does not already exist,
 * and starts it. When a `UNLOAD_CONTENT_SCRIPT` message is received, it stops the
 * `ContentScriptClientService` instance and destroys it.
 *
 * By controlling the lifecycle of the `ContentScriptClientService` instance in this
 * way, we can ensure that only one instance of the client content-script is running
 * at a time, and that it is properly cleaned up when no longer needed */
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import browser from '@proton/pass/lib/globals/browser';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { WorkerMessageType, type WorkerMessageWithSender } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { isMainFrame } from '@proton/pass/utils/dom/is-main-frame';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import noop from '@proton/utils/noop';

import { ProtonPassControl } from './injections/custom-elements/ProtonPassControl';
import { ProtonPassRoot } from './injections/custom-elements/ProtonPassRoot';
import type { ContentScriptClientService } from './services/script';
import { createContentScriptClient } from './services/script';

const scriptId = uniqueId(16);
const mainFrame = isMainFrame();

/**
 * Due to Firefox's limitations in supporting custom elements with content-scripts
 * without disrupting interaction with the injected web page, we employ a workaround.
 * We inject `elements.js` via a script tag to prevent custom elements registration
 * in a privileged realm. Monitor these issues for potential resolution:
 * - https://bugzilla.mozilla.org/show_bug.cgi?id=1492002
 * - https://bugzilla.mozilla.org/show_bug.cgi?id=1836269
 *
 * See: `applications/pass-extension/src/app/worker/services/injection.ts` for injection
 * specifics. For Chromium builds, `elements.js` will be injected in the MAIN world to
 * effectively register the custom elements in a non-isolated realm.
 */
const registerCustomElements = async (): Promise<PassElementsConfig> => {
    if (BUILD_TARGET === 'firefox') {
        await new Promise<void>((resolve, reject) => {
            const listeners = createListenerStore();

            const script = document.createElement('script');
            script.src = browser.runtime.getURL('elements.js');

            const destroy = () => {
                listeners.removeAll();
                script.remove();
            };

            script.addEventListener('load', () => resolve(destroy()));
            script.addEventListener('error', () => reject(destroy()));
            (document.head || document.documentElement).appendChild(script);
        });
    }

    const result = await sendMessage(contentScriptMessage({ type: WorkerMessageType.REGISTER_ELEMENTS }));
    if (result.type === 'error') throw new Error('Custom elements registration failure');

    const root = ProtonPassRoot.getTagName(result.hash);
    const control = ProtonPassControl.getTagName(result.hash);
    return { root, control };
};

void (async () =>
    registerCustomElements().then((elements) => {
        let script: MaybeNull<ContentScriptClientService> =
            document.visibilityState === 'visible'
                ? createContentScriptClient({ scriptId, mainFrame, elements })
                : null;

        Promise.resolve(script?.start())
            .then(() => {
                browser.runtime.onMessage.addListener(async (message: Maybe<WorkerMessageWithSender>) => {
                    if (message?.sender === 'background') {
                        switch (message.type) {
                            case WorkerMessageType.START_CONTENT_SCRIPT:
                                script = script ?? createContentScriptClient({ scriptId, mainFrame, elements });
                                void script.start();
                                break;
                            case WorkerMessageType.UNLOAD_CONTENT_SCRIPT:
                                script?.destroy({ reason: 'unload' });
                                script = null;
                                break;
                        }
                    }
                });
            })
            .catch(noop);
    }))();
