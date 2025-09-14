import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { clipboardWorker } from 'proton-pass-extension/app/worker/offscreen/clipboard.api';
import { createExtensionAlarm } from 'proton-pass-extension/lib/utils/alarm';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { createClipboardService as createCoreClipboardService } from '@proton/pass/lib/clipboard/service';

export const createClipboardService = () => {
    /** Use extension alarm factory to handle clipboard clearing reliably.
     * For delays ≥1min, browser extension alarms survive service worker restarts,
     * while `setTimeout` would be lost when the service worker is terminated. */
    const service = createCoreClipboardService(clipboardWorker, createExtensionAlarm);

    WorkerMessageBroker.registerMessage(WorkerMessageType.CLIPBOARD_AUTOCLEAR, async ({ payload }) => {
        service.autoClear(payload.timeoutMs, payload.content);
        return true;
    });

    return service;
};
