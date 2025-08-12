import { setupOffscreenDocument } from 'proton-pass-extension/app/worker/offscreen/offscreen.utils';
import { resolveMessageFactory, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { sendSafariMessage } from 'proton-pass-extension/lib/utils/safari';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { ClipboardApi } from '@proton/pass/lib/clipboard/types';
import { logger } from '@proton/pass/utils/logger';

const messageFactory = resolveMessageFactory('offscreen');

const CLIPBOARD_OFFSCREEN_PATH = 'offscreen.html';

export const clipboardWorker: ClipboardApi = {
    read: async () => {
        // Navigator clipboard API is available in Firefox extensions
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard#webextensions.api.clipboard
        try {
            if (navigator && navigator.clipboard) {
                return await navigator.clipboard.readText();
            }
        } catch {
            logger.debug('[Clipboard] Failed to read clipboard using navigator.clipboard');
        }

        // In safari, use native implementation
        try {
            if (BUILD_TARGET === 'safari') {
                const result = await sendSafariMessage({ readFromClipboard: {} });
                return result as string;
            }
        } catch {
            logger.debug('[Clipboard] Failed to read clipboard using native Safari implementation');
        }

        // It neither Firefox nor Safari we are most probably in Chrome and can use offscreen document
        try {
            await setupOffscreenDocument(CLIPBOARD_OFFSCREEN_PATH);
            return await sendMessage.on(messageFactory({ type: WorkerMessageType.CLIPBOARD_OFFSCREEN_READ }), (res) =>
                res.type === 'success' ? res.content : Promise.reject(new Error('Clipboard read failed'))
            );
        } catch {
            logger.debug('[Clipboard] Failed to read clipboard using offscreen document');
        }

        logger.error('[Clipboard] None clipboard read strategy worked');
        return '';
    },

    write: async (content) => {
        // Navigator clipboard API is available in Firefox extensions
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard#webextensions.api.clipboard
        try {
            if (navigator && navigator.clipboard) {
                return await navigator.clipboard.writeText(content);
            }
        } catch {
            logger.debug('[Clipboard] Failed to write to clipboard using navigator.clipboard');
        }

        // In safari, use native implementation
        try {
            if (BUILD_TARGET === 'safari') {
                await sendSafariMessage({ writeToClipboard: { Content: content } });
                return;
            }
        } catch {
            logger.debug('[Clipboard] Failed to read clipboard using native Safari implementation');
        }

        // It neither Firefox nor Safari we are most probably in Chrome and can use offscreen document
        try {
            await setupOffscreenDocument(CLIPBOARD_OFFSCREEN_PATH);
            return await sendMessage.on(
                messageFactory({ type: WorkerMessageType.CLIPBOARD_OFFSCREEN_WRITE, payload: { content } }),
                (res) => {
                    if (res.type === 'error') {
                        return Promise.reject(new Error('Clipboard write failed'));
                    }
                }
            );
        } catch {
            logger.debug('[Clipboard] Failed to read clipboard using offscreen document');
        }

        logger.error('[Clipboard] None clipboard write strategy worked');
    },
};
