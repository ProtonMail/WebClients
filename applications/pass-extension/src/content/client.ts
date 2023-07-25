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
import browser from '@proton/pass/globals/browser';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { WorkerMessageType, type WorkerMessageWithSender } from '@proton/pass/types';
import { isMainFrame } from '@proton/pass/utils/dom';
import { uniqueId } from '@proton/pass/utils/string';

import type { ContentScriptClientService } from './services';
import { createContentScriptClient } from './services';

const CLIENT_ID = uniqueId(16);
const MAIN_FRAME = isMainFrame();

let script: MaybeNull<ContentScriptClientService> =
    document.visibilityState === 'visible' ? createContentScriptClient(CLIENT_ID, MAIN_FRAME) : null;

Promise.resolve(script?.start())
    .then(() => {
        browser.runtime.onMessage.addListener((message: Maybe<WorkerMessageWithSender>) => {
            if (message?.sender === 'background') {
                switch (message.type) {
                    case WorkerMessageType.START_CONTENT_SCRIPT:
                        script = script ?? createContentScriptClient(CLIENT_ID, MAIN_FRAME);
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
    .catch((e) => console.warn(e));
