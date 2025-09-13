import { createClipboardService } from '@proton/pass/lib/clipboard/service';
import type { ClipboardApi } from '@proton/pass/lib/clipboard/types';

export const clipboardApi: ClipboardApi = {
    read: async () => window.ctxBridge?.readFromClipboard() || '',
    write: async (content: string) => window.ctxBridge?.writeToClipboard(content),
};

export const clipboard = createClipboardService(clipboardApi);
