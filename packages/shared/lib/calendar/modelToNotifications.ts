import { NotificationModel } from '../interfaces/calendar';
import { getValarmTrigger } from './getValarmTrigger';
import { toTriggerString } from './vcal';

export const modelToNotifications = (notifications: NotificationModel[] = []) => {
    return notifications.map((notificationModel) => ({
        Type: notificationModel.type,
        Trigger: toTriggerString(getValarmTrigger(notificationModel)),
    }));
};
