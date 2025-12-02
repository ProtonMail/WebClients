import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import 'proton-pass-extension/lib/polyfills/shim';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import browser from '@proton/pass/lib/globals/browser';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener/factory';

import { getControlTagName } from './ProtonPassControl';
import { getRootTagName } from './ProtonPassRoot';

/** Firefox versions <128 had limitations in supporting custom elements with content-scripts
 * without disrupting interaction with the injected web page. For these versions, we employ
 * a workaround by injecting `elements.js` via a script tag to prevent custom elements
 * registration in a privileged realm. Firefox ≥128 supports MAIN world execution natively.
 * Historical issues that led to this workaround:
 * - https://bugzilla.mozilla.org/show_bug.cgi?id=1492002
 * - https://bugzilla.mozilla.org/show_bug.cgi?id=1836269
 *
 * See: `applications/pass-extension/src/app/worker/services/injection.ts` for injection
 * specifics. For browsers supporting MAIN world injection (Chrome, Safari, Firefox ≥128),
 * `elements.js` will be injected directly. For older Firefox versions, falls back to
 * script injection technique to register custom elements in a non-isolated realm. */
export const registerCustomElements = async (): Promise<PassElementsConfig> => {
    const result = await sendMessage(contentScriptMessage({ type: WorkerMessageType.REGISTER_ELEMENTS }));
    if (result.type === 'error') throw new Error('Custom elements registration failure');

    if (BUILD_TARGET === 'firefox' && result.scriptFallback) {
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

        await sendMessage(
            contentScriptMessage({
                type: WorkerMessageType.REGISTER_ELEMENTS_FALLBACK,
                payload: result,
            })
        );
    }

    const root = getRootTagName(result.hash);
    const control = getControlTagName(result.hash);

    return { root, control };
};
