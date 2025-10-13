import type { IFrameRegistry } from 'proton-pass-extension/app/content/services/iframes/registry';
import type { NotificationHandler } from 'proton-pass-extension/app/content/services/inline/handlers/notification.abstract';

export const createNotificationTopHandler = (registry: IFrameRegistry): NotificationHandler => ({
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
