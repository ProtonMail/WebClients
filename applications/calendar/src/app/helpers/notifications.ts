import { NOTIFICATION_WHEN } from '../constants';
import { NotificationModel } from '../interfaces/NotificationModel';

export const filterFutureNotifications = (notifications: NotificationModel[]) => {
    return notifications.filter(({ when, value }) => {
        if (when === NOTIFICATION_WHEN.BEFORE) {
            return true;
        }
        return value === 0;
    });
};
