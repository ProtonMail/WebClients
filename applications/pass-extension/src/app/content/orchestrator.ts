/* Handling multiple instances of the orchestrator being injected is
 * necessary to ensure that the content-scripts are properly loaded
 * and unloaded as needed. This can be particularly important during
 * updates or hot-reload scenarios, where multiple instances of the
 * orchestrator may be living simultaneously. By unloading the client
 * content-script when the frame becomes hidden, we can free up resources
 * on inactive tabs, further improving performance and minimizing the
 * impact on the user's experience */
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import 'proton-pass-extension/lib/utils/polyfills';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { waitForPageReady } from '@proton/pass/utils/dom/state';
import { wait } from '@proton/shared/lib/helpers/promise';

import { DOMCleanUp } from './injections/cleanup';

const unloadContentScript = () => sendMessage(contentScriptMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT }));
const loadContentScript = () => sendMessage(contentScriptMessage({ type: WorkerMessageType.LOAD_CONTENT_SCRIPT }));
const ping = () => sendMessage(contentScriptMessage({ type: WorkerMessageType.PING }));

/* This IIFE is responsible for handling every new content-script injection. It starts
 * by cleaning up the DOM (in case of concurrent scripts running) and unloading any client
 * content-scripts. Depending on the current visibility state, either the client content
 * script is registered again or unloaded. TODO: add extra heuristics steps before actually
 * loading the client content-script : This would allows us to perform additional checks to
 * determine whether or not the client should be injected, potentially saving resources and
 * improving performance (ie: run the form detection assessment here) */
void (async () => {
    try {
        /* Prevent injection on non-HTML documents, for example XML files */
        const documentElement = document.ownerDocument || document;
        if (!documentElement?.body) return;

        await waitForPageReady();

        /** In Firefox & Safari, stale content-scripts are automatically disabled
         * and new ones are re-injected as needed. Consequently, the destroy sequence
         * triggered by the disconnection of a stale port will not be executed */
        DOMCleanUp({
            root: '[data-protonpass-role="root"]',
            control: '[data-protonpass-role="icon"]',
        });

        if (BUILD_TARGET === 'safari') {
            /** Perform a sanity check before initiating the client registration sequence.
             * If a critical error message is detected, introduce a brief delay to mitigate
             * a potential race condition in Safari's service worker registration process. */
            const res = await ping();
            if (res.type === 'error' && res.critical) await wait(1_000);
        }

        await unloadContentScript();
        await loadContentScript();
    } catch (_err) {
        void unloadContentScript();
    }
})();
