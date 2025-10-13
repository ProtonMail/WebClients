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
import { createClientController } from 'proton-pass-extension/app/content/client.controller';
import { createContentScriptClient as clientFactory } from 'proton-pass-extension/app/content/services/client';
import { registerCustomElements } from 'proton-pass-extension/app/content/services/inline/custom-elements/register';
import 'proton-pass-extension/lib/polyfills/shim';

import { isMainFrame } from '@proton/pass/utils/dom/is-main-frame';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import noop from '@proton/utils/noop';

(async () => {
    const elements = await registerCustomElements();
    const mainFrame = isMainFrame();
    const scriptId = uniqueId(16);

    const controller = createClientController({ elements, mainFrame, scriptId, clientFactory });
    return controller.init();
})().catch(noop);
