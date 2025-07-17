import type { ClipboardApi, ClipboardService } from '@proton/pass/lib/clipboard/types';
import noop from '@proton/utils/noop';

export const createClipboardService = (clipboard: ClipboardApi): ClipboardService => {
    let clipboardTimer: NodeJS.Timeout | undefined;

    const service = {
        startClearTimeout: (timeoutMs: number, content: string) => {
            if (clipboardTimer !== undefined) clearTimeout(clipboardTimer);

            if (timeoutMs <= 0) return;

            clipboardTimer = setTimeout(async () => {
                const currentText = await clipboard.read();
                if (currentText !== content) return;
                clipboard.write('').catch(noop);
            }, timeoutMs);
        },
    };

    return service;
};
