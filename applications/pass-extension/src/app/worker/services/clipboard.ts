import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { clipboardOffscreen } from 'proton-pass-extension/app/worker/offscreen/clipboard.api';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { createClipboardService as createCoreClipboardService } from '@proton/pass/lib/clipboard/service';
import type { SettingsService } from '@proton/pass/lib/settings/service';

export const createClipboardService = (settings: SettingsService) => {
    const service = createCoreClipboardService(settings, undefined, clipboardOffscreen);

    WorkerMessageBroker.registerMessage(WorkerMessageType.CLIPBOARD_WRITE, async ({ payload }) => {
        await service.writeClipboardContent(payload.content);
        return true;
    });

    return service;
};
