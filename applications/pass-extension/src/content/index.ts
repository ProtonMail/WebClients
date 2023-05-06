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

import { handleForkFallback } from './auth-fallback';
import { CONTENT_SCRIPT_INJECTED_MESSAGE } from './constants';
import { DOMCleanUp } from './injections/cleanup';
import { type ContentScriptService, createContentScriptService } from './services/content-script';

import './injections/injection.scss';

const mainFrame = isMainFrame();
const CONTENT_SCRIPT_ID = uniqueId();

export let contentScript: MaybeNull<ContentScriptService> = null;

export const unregisterContentScript = (reason: string) => {
    contentScript?.destroy({ recycle: false, reason });
    contentScript = null;
};

export const registerContentScript = () => {
    contentScript = createContentScriptService(CONTENT_SCRIPT_ID, mainFrame);
    contentScript?.start().catch(() => unregisterContentScript('start failure'));
};

export const handleFrameVisibilityChange = () => {
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

export const handleIncomingCSPostMessage = (message: MessageEvent) => {
    if (message.data?.type === CONTENT_SCRIPT_INJECTED_MESSAGE && message?.data?.id !== CONTENT_SCRIPT_ID) {
        logger.info(`[ContentScript::${CONTENT_SCRIPT_ID}] new script detected ${message.data.id}`);
        window.removeEventListener('visibilitychange', handleFrameVisibilityChange);
        window.removeEventListener('message', handleIncomingCSPostMessage);
        unregisterContentScript('incoming injection');
    }
};

const main = () => {
    if (BUILD_TARGET === 'firefox' && mainFrame) handleForkFallback();

    window.postMessage({ type: CONTENT_SCRIPT_INJECTED_MESSAGE, id: CONTENT_SCRIPT_ID }, '*');
    DOMCleanUp();

    window.addEventListener('message', handleIncomingCSPostMessage);
    window.addEventListener('visibilitychange', handleFrameVisibilityChange);

    return document.visibilityState === 'visible' && registerContentScript();
};

main();
