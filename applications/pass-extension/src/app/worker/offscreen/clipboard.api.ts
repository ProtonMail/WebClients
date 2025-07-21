import { setupOffscreenDocument } from 'proton-pass-extension/app/worker/offscreen/offscreen.utils';
import { resolveMessageFactory, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { ClipboardApi } from '@proton/pass/lib/clipboard/types';
import { logger } from '@proton/pass/utils/logger';

const messageFactory = resolveMessageFactory('offscreen');

const CLIPBOARD_OFFSCREEN_PATH = 'offscreen.html';

export const clipboardWorker: ClipboardApi = {
    read: async () => {
        console.warn('[DEBUG] Reading clipboard from extension worker');

        // Navigator clipboard API is available in Firefox extensions
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard#webextensions.api.clipboard
        try {
            if (navigator && navigator.clipboard) {
                console.warn('[DEBUG] clipboard worker clipboard api read');
                return await navigator.clipboard.readText();
            }
        } catch {
            logger.debug('[Clipboard] Failed to read clipboard using navigator.clipboard');
        }

        // In safari, use native implementation
        try {
            if (BUILD_TARGET === 'safari') {
                console.warn('sendSafariMessage read clipboard todo');
                throw new Error('not implemented');
            }
        } catch {
            logger.debug('[Clipboard] Failed to read clipboard using native Safari implementation');
        }

        // It neither Firefox nor Safari we are most probably in Chrome and can use offscreen document
        try {
            console.warn('[DEBUG] clipboard worker offscreen read');

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

    write: async (content: string) => {
        console.warn('[DEBUG] Writing clipboard from extension worker');

        // Navigator clipboard API is available in Firefox extensions
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard#webextensions.api.clipboard
        try {
            if (navigator && navigator.clipboard) {
                console.warn('[DEBUG] clipboard worker clipboard api write', content);

                return await navigator.clipboard.writeText(content);
            }
        } catch {
            logger.debug('[Clipboard] Failed to write to clipboard using navigator.clipboard');
        }

        // In safari, use native implementation
        try {
            if (BUILD_TARGET === 'safari') {
                console.warn('sendSafariMessage write clipboard todo');
                throw new Error('not implemented');
            }
        } catch {
            logger.debug('[Clipboard] Failed to read clipboard using native Safari implementation');
        }

        // It neither Firefox nor Safari we are most probably in Chrome and can use offscreen document
        try {
            console.warn('[DEBUG] clipboard worker offscreen write', content);

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
