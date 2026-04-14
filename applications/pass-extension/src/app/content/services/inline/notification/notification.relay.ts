import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import noop from '@proton/utils/noop';

import type { NotificationHandler } from './notification.abstract';

/** Notification relay for sub-frames: forwards open requests through the
 * service worker to the top frame, where the notification UI is rendered.
 * attach/close/destroy are no-ops until cross-frame autosave reconciliation
 * is implemented. */
export const createNotificationRelayHandler = (): NotificationHandler => ({
    attach: noop,
    open: (payload) =>
        sendMessage(
            contentScriptMessage({
                type: WorkerMessageType.INLINE_NOTIFICATION_OPEN,
                payload,
            })
        ).catch(noop),
    close: noop,
    destroy: noop,
});
