import type { NotificationHandler } from 'proton-pass-extension/app/content/services/inline/handlers/notification.abstract';

import noop from '@proton/utils/noop';

/** TODO: implement when supporting cross-frame autosave capabilities */
export const createNotificationRelayHandler = (): NotificationHandler => ({
    attach: noop,
    open: noop,
    close: noop,
    destroy: noop,
});
