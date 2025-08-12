import type { ClipboardApi, ClipboardService } from '@proton/pass/lib/clipboard/types';
import type { Maybe } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const createClipboardService = (clipboard: ClipboardApi): ClipboardService => {
    let clipboardTimer: Maybe<NodeJS.Timeout>;

    const service = {
        startClearTimeout: (timeoutMs: number, content: string) => {
            if (clipboardTimer !== undefined) clearTimeout(clipboardTimer);

            if (timeoutMs <= 0) return;

            clipboardTimer = setTimeout(async () => {
                const currentText = await clipboard.read().catch(noop());
                if (currentText !== content) return;
                clipboard.write('').catch(noop);
            }, timeoutMs);
        },
    };

    return service;
};
