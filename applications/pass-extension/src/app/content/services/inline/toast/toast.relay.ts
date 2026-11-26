import noop from '@proton/utils/noop';

import { contentScriptMessage, sendMessage } from '../../../../../lib/message/send-message';
import { WorkerMessageType } from '../../../../../types/messages';
import type { InlineToastHandler } from './toast.abstract';

/** Toast relay for sub-frames: forwards open requests through the
 * service worker to the top frame, where the toast UI is rendered.
 * attach/close/destroy are no-ops until cross-frame autosave reconciliation
 * is implemented. */
export const createToastRelayHandler = (): InlineToastHandler => ({
    attach: noop,
    open: (payload) =>
        sendMessage(
            contentScriptMessage({
                type: WorkerMessageType.INLINE_TOAST_OPEN,
                payload,
            })
        ).catch(noop),
    close: noop,
    destroy: noop,
});
