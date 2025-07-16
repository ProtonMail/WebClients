import { clipboardApi } from '@proton/pass/lib/clipboard/clipboard.api';
import type { ClipboardApi, ClipboardService } from '@proton/pass/lib/clipboard/types';
import type { SettingsService } from '@proton/pass/lib/settings/service';
import noop from '@proton/utils/noop';

export const createClipboardService = (
    settings: SettingsService,
    localID: number | undefined,
    clipboard: ClipboardApi = clipboardApi
): ClipboardService => {
    let clipboardTimer: NodeJS.Timeout | undefined;

    const service = {
        writeClipboardContent: async (text: string) => {
            if (clipboardTimer !== undefined) clearTimeout(clipboardTimer);

            await clipboard.write(text);

            const settingsValue = await settings.read(localID);
            const { timeoutMs } = settingsValue.clipboard || {};
            if (!timeoutMs || timeoutMs <= 0) return;

            clipboardTimer = setTimeout(async () => {
                const currentText = await clipboard.read();
                if (currentText !== text) return;
                clipboard.write('').catch(noop);
            }, timeoutMs);
        },
    };

    return service;
};
