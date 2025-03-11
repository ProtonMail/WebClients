import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import 'proton-pass-extension/lib/utils/polyfills';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import browser from '@proton/pass/lib/globals/browser';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener/factory';

import { ProtonPassControl } from './ProtonPassControl';
import { ProtonPassRoot } from './ProtonPassRoot';

export type CustomElementsRegister = () => Promise<PassElementsConfig>;

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
export const registerCustomElements: CustomElementsRegister = async () => {
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
