/* Multiple content-script can happen to live on the
 * same page (extension update, dev hot-reload etc..).
 * Any incoming content-script should take precedence
 * over stale ones -> Emit a message on the current tab's
 * window to notify siblings & force clean-up any DOM
 * another content-script may have mutated */
import uniqid from 'uniqid';

import { fathom } from '@proton/pass/fathom/protonpass-fathom';
import type { MaybeNull } from '@proton/pass/types';
import { isMainFrame } from '@proton/pass/utils/dom';
import { waitUntil } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';

import { handleForkFallback } from './auth-fallback';
import { CONTENT_SCRIPT_INJECTED_MESSAGE } from './constants';
import { DOMCleanUp } from './injections/cleanup';
import { type ContentScriptService, createContentScriptService } from './services/content-script';

import './injections/injection.scss';

const { isVisible } = fathom.utils;

const mainFrame = isMainFrame();
const CONTENT_SCRIPT_ID = uniqid();
export let contentScript: MaybeNull<ContentScriptService> = null;

export const prepare = (id: string) => {
    window.postMessage({ type: CONTENT_SCRIPT_INJECTED_MESSAGE, id }, '*');
    DOMCleanUp();
};

export const registerContentScript = () => {
    contentScript = createContentScriptService(CONTENT_SCRIPT_ID, mainFrame);
    void contentScript.start();
};

export const unregisterContentScript = (reason: string) => {
    contentScript?.destroy({ recycle: false, reason });
    contentScript = null;
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

    prepare(CONTENT_SCRIPT_ID);

    window.addEventListener('message', handleIncomingCSPostMessage);
    window.addEventListener('visibilitychange', handleFrameVisibilityChange);

    /* Ensure the content-script service is first created
     * when the body is visible - on certain websites JS
     * will defer the body's initial visibility (ie: europa login)
     * and we may trigger the initial form detection too early */
    void waitUntil(() => isVisible(document.body), 100).then(
        () => document.visibilityState === 'visible' && registerContentScript()
    );
};

main();
