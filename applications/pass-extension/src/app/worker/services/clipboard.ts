import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { setupOffscreenDocument } from 'proton-pass-extension/app/worker/offscreen/offscreen.utils';
import { offscreenMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { createExtensionAlarm } from 'proton-pass-extension/lib/utils/alarm';
import { sendSafariMessage } from 'proton-pass-extension/lib/utils/safari';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { createClipboardService as createCoreClipboardService } from '@proton/pass/lib/clipboard/service';
import type { ClipboardApi } from '@proton/pass/lib/clipboard/types';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

const CLIPBOARD_OFFSCREEN_PATH = 'offscreen.html';

/** Extension clipboard service with platform-specific fallback strategies :
 * 1. Primary: Modern `navigator.clipboard` API (Firefox and future-compliant browsers)
 * 2. Chrome fallback: Offscreen document with legacy `document.execCommand`
 * 3. Safari fallback: Native Swift bridge implementation */
export const extensionClipboardApi: ClipboardApi = {
    read: async () => {
        try {
            if (navigator && navigator.clipboard) return await navigator.clipboard.readText();
        } catch {
            logger.debug('[Clipboard] Failed to read using navigator.clipboard');
        }

        if (BUILD_TARGET === 'chrome') {
            try {
                await setupOffscreenDocument(CLIPBOARD_OFFSCREEN_PATH);
                return await sendMessage.on(
                    offscreenMessage({ type: WorkerMessageType.CLIPBOARD_OFFSCREEN_READ }),
                    (res) => (res.type === 'success' ? res.content : Promise.reject())
                );
            } catch {
                logger.debug('[Clipboard] Failed to read using offscreen document');
            }
        }

        if (BUILD_TARGET === 'safari') {
            try {
                return await sendSafariMessage<string>({ readFromClipboard: {} });
            } catch {
                logger.debug('[Clipboard] Failed to read using native Safari implementation');
            }
        }

        logger.error('[Clipboard] No clipboard read strategy worked');
        return '';
    },

    write: async (content) => {
        try {
            if (navigator && navigator.clipboard) return await navigator.clipboard.writeText(content);
        } catch {
            logger.debug('[Clipboard] Failed to write to clipboard using navigator.clipboard');
        }

        if (BUILD_TARGET === 'chrome') {
            try {
                await setupOffscreenDocument(CLIPBOARD_OFFSCREEN_PATH);
                return await sendMessage.on(
                    offscreenMessage({ type: WorkerMessageType.CLIPBOARD_OFFSCREEN_WRITE, payload: { content } }),
                    (res) => (res.type === 'error' ? Promise.reject() : undefined)
                );
            } catch {
                logger.debug('[Clipboard] Failed to write clipboard using offscreen document');
            }
        }

        if (BUILD_TARGET === 'safari') {
            try {
                return await sendSafariMessage({ writeToClipboard: { Content: content } }).then(noop);
            } catch {
                logger.debug('[Clipboard] Failed to write clipboard using native Safari implementation');
            }
        }

        logger.error('[Clipboard] No clipboard write strategy worked');
    },
};

export const createClipboardService = () => {
    /** Use extension alarm factory to handle clipboard clearing reliably.
     * For delays ≥1min, browser extension alarms survive service worker restarts,
     * while `setTimeout` would be lost when the service worker is terminated. */
    const service = createCoreClipboardService(extensionClipboardApi, createExtensionAlarm);

    WorkerMessageBroker.registerMessage(WorkerMessageType.CLIPBOARD_AUTOCLEAR, async ({ payload }) => {
        service.autoClear(payload.timeoutMs, payload.content);
        return true;
    });

    return service;
};
