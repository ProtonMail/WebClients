import uniqid from 'uniqid';

import { fathom } from '@proton/pass/fathom/protonpass-fathom';
import { isMainFrame } from '@proton/pass/utils/dom';
import { waitUntil } from '@proton/pass/utils/fp';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

import { handleForkFallback } from './auth/fork';
import { CONTENT_SCRIPT_INJECTED_MESSAGE } from './constants';
import { DOMCleanUp } from './injections/cleanup';
import { createContentScriptService } from './services/content-script';

import './injections/injection.scss';

const { isVisible } = fathom.utils;

const CONTENT_SCRIPT_ID = uniqid();

/**
 * Multiple content-script can happen to live on the
 * same page (extension update, dev hot-reload etc..).
 * Any incoming content-script should take precedence
 * over stale ones -> Emit a message on the current tab's
 * window to notify siblings & force clean-up any DOM
 * another content-script may have mutated.
 */
window.postMessage({ type: CONTENT_SCRIPT_INJECTED_MESSAGE, id: CONTENT_SCRIPT_ID }, '*');
DOMCleanUp();

if (BUILD_TARGET === 'firefox') {
    handleForkFallback();
}

/**
 * Ensure the first detection runs
 * when the body is visible - on certain
 * websites JS will defer the body's initial
 * visibility (ie: europa login)
 *
 * Ensure the content-script service is created
 * on the next tick to allow stale content-scripts
 * to process the CONTENT_SCRIPT_INJECTED_MESSAGE
 */
waitUntil(() => isVisible(document.body), 100)
    .then(() => wait(0))
    .then(() => requestAnimationFrame(() => createContentScriptService(CONTENT_SCRIPT_ID).watch(isMainFrame())))
    .catch(noop);
