import type { ClipboardApi, ClipboardService } from '@proton/pass/lib/clipboard/types';
import type { Maybe } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const createClipboardService = (clipboard: ClipboardApi): ClipboardService => {
    let clipboardTimer: Maybe<NodeJS.Timeout>;

    return {
        ...clipboard,
        autoClear: (timeoutMs, value) => {
            if (clipboardTimer !== undefined) clearTimeout(clipboardTimer);

            if (timeoutMs <= 0) return;

            clipboardTimer = setTimeout(async () => {
                const current = await clipboard.read().catch(noop());
                if (current === value) clipboard.write('').catch(noop);
            }, timeoutMs);
        },
    };
};
