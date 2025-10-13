import type { InlineRegistry } from 'proton-pass-extension/app/content/services/inline/inline.registry';

import type { NotificationHandler } from './notification.abstract';

export const createNotificationHandler = (registry: InlineRegistry): NotificationHandler => ({
    attach: () => registry.attachNotification(),
    open: (request) => registry.attachNotification()?.open(request),
    close: (action) => {
        /* If an action is passed as a parameter, only close the
         * notification if it is currently attached to this action. */
        if (action && registry.notification?.getState().action !== action) return;
        registry.notification?.close();
    },
    destroy: () => registry.notification?.destroy(),
});
