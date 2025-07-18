import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { clipboardWorker } from 'proton-pass-extension/app/worker/offscreen/clipboard.api';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { createClipboardService as createCoreClipboardService } from '@proton/pass/lib/clipboard/service';

export const createClipboardService = () => {
    const service = createCoreClipboardService(clipboardWorker);

    WorkerMessageBroker.registerMessage(WorkerMessageType.CLIPBOARD_START_CLEAR_TIMEOUT, async ({ payload }) => {
        service.startClearTimeout(payload.timeoutMs, payload.content);
        return true;
    });

    return service;
};
