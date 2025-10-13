import type { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';

import type { NotificationRequest } from './notification.app';

export interface NotificationHandler {
    attach: () => void;
    close: (action?: NotificationAction) => void;
    destroy: () => void;
    open: (request: NotificationRequest) => void;
}
