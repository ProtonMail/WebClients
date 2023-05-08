/* Multiple content-script can happen to live on the
 * same page (extension update, dev hot-reload etc..).
 * Any incoming content-script should take precedence
 * over stale ones -> Emit a message on the current tab's
 * window to notify siblings & force clean-up any DOM
 * another content-script may have mutated */
import type { MaybeNull } from '@proton/pass/types';
import { isMainFrame } from '@proton/pass/utils/dom';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string';

import { CONTENT_SCRIPT_INJECTED_MESSAGE } from './constants';
import { DOMCleanUp } from './injections/cleanup';
import { type ContentScriptService, createContentScriptService } from './services/content-script';

import './injections/injection.scss';

const mainFrame = isMainFrame();
const CONTENT_SCRIPT_ID = uniqueId(12);

let contentScript: MaybeNull<ContentScriptService> = null;

/* destroy the content-script service if registered and
 * resets the current content-script reference */
const unregisterContentScript = (reason: string) => {
    contentScript?.destroy({ recycle: false, reason });
    contentScript = null;
};

/* creates the content-script service and starts it immediately.
 * any errors during this sequence will unregister it*/
const registerContentScript = () => {
    contentScript = createContentScriptService(CONTENT_SCRIPT_ID, mainFrame);
    contentScript?.start().catch(() => unregisterContentScript('start failure'));
};

/* when the frame becomes hidden destroy the content-script
 * to free-up resources on inactive tabs. As soon as it is
 * visible: re-create it from scratch */
const handleFrameVisibilityChange = () => {
    try {
        switch (document.visibilityState) {
            case 'visible':
                return registerContentScript();
            case 'hidden':
                return unregisterContentScript('visibility change');
        }
    } catch (e) {
        logger.warn(`[ContentScript::${CONTENT_SCRIPT_ID}] invalidation error`, e);
        unregisterContentScript('context invalidated');
    }
};

const handleIncomingCSPostMessage = (message: MessageEvent) => {
    if (window.self !== window.top) return;

    if (message.data?.type === CONTENT_SCRIPT_INJECTED_MESSAGE && message?.data?.id !== CONTENT_SCRIPT_ID) {
        logger.info(`[ContentScript::${CONTENT_SCRIPT_ID}] new script detected ${message.data.id}`);
        window.removeEventListener('visibilitychange', handleFrameVisibilityChange);
        window.removeEventListener('message', handleIncomingCSPostMessage);
        unregisterContentScript('incoming injection');
    }
};

/* on every new content-script injection : clean-up the DOM
 * and notify any other content-script living on the same tab */
const main = () => {
    DOMCleanUp();

    logger.info(`[ContentScript::${CONTENT_SCRIPT_ID}] Start injection sequence`);
    window.postMessage({ type: CONTENT_SCRIPT_INJECTED_MESSAGE, id: CONTENT_SCRIPT_ID }, window.location.origin);
    window.addEventListener('message', handleIncomingCSPostMessage);
    window.addEventListener('visibilitychange', handleFrameVisibilityChange);

    return document.visibilityState === 'visible' && registerContentScript();
};

main();
