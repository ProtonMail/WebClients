import { NotificationModel } from '../interfaces/calendar';
import { toTriggerString } from './vcal';
import { getValarmTrigger } from './getValarmTrigger';

export const modelToNotifications = (notifications: NotificationModel[] = []) => {
    return notifications.map((notificationModel) => ({
        Type: notificationModel.type,
        Trigger: toTriggerString(getValarmTrigger(notificationModel)),
    }));
};
