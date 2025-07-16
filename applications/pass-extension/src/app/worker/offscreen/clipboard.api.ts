import { setupOffscreenDocument } from 'proton-pass-extension/app/worker/offscreen/offscreen.utils';
import { resolveMessageFactory, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { ClipboardApi } from '@proton/pass/lib/clipboard/types';

const messageFactory = resolveMessageFactory('offscreen');

const CLIPBOARD_OFFSCREEN_PATH = 'offscreen.html';

export const clipboardOffscreen: ClipboardApi = {
    read: async () => {
        await setupOffscreenDocument(CLIPBOARD_OFFSCREEN_PATH);
        return sendMessage.on(messageFactory({ type: WorkerMessageType.CLIPBOARD_OFFSCREEN_READ }), (res) =>
            res.type === 'success' ? res.content : Promise.reject(new Error('Clipboard read failed'))
        );
    },
    write: async (content: string) => {
        await setupOffscreenDocument(CLIPBOARD_OFFSCREEN_PATH);
        return sendMessage.on(
            messageFactory({ type: WorkerMessageType.CLIPBOARD_OFFSCREEN_WRITE, payload: { content } }),
            (res) => {
                if (res.type === 'error') {
                    return Promise.reject(new Error('Clipboard write failed'));
                }
            }
        );
    },
};
