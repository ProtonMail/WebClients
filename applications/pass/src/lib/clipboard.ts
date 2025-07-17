import { createClipboardService } from '@proton/pass/lib/clipboard/service';
import type { ClipboardApi } from '@proton/pass/lib/clipboard/types';

export const clipboardApi: ClipboardApi = {
    read: async () => navigator.clipboard.readText(),
    write: async (content: string) => navigator.clipboard.writeText(content),
};

export const clipboard = createClipboardService(clipboardApi);
