import type { NotificationAction } from '../../../constants.runtime';
import type { NotificationRequest } from './notification.app';

export interface NotificationHandler {
    attach: () => void;
    close: (action?: NotificationAction) => void;
    destroy: () => void;
    open: (request: NotificationRequest) => void;
}
