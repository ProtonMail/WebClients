import noop from '@proton/utils/noop';

import type { NotificationHandler } from './notification.abstract';

/** TODO: implement when supporting cross-frame autosave capabilities */
export const createNotificationRelayHandler = (): NotificationHandler => ({
    attach: noop,
    open: noop,
    close: noop,
    destroy: noop,
});
