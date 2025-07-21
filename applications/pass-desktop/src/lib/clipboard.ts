import { createClipboardService } from '@proton/pass/lib/clipboard/service';
import type { ClipboardApi } from '@proton/pass/lib/clipboard/types';

export const clipboardApi: ClipboardApi = {
    read: async () => {
        console.warn('[DEBUG] Reading clipboard from electron bridge');

        return window.ctxBridge?.readFromClipboard() || '';
    },
    write: async (content: string) => {
        console.warn('[DEBUG] Writing clipboard from electron bridge');

        return window.ctxBridge?.writeToClipboard(content);
    },
};

export const clipboard = createClipboardService(clipboardApi);
