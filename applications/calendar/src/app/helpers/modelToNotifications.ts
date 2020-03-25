import { toTriggerString } from 'proton-shared/lib/calendar/vcal';
import { NotificationModel } from '../interfaces/NotificationModel';
import { getValarmTrigger } from '../components/eventModal/eventForm/getValarmTrigger';

export const modelToNotifications = (notifications: NotificationModel[] = []) => {
    return notifications.map((notificationModel) => ({
        Type: notificationModel.type,
        Trigger: toTriggerString(getValarmTrigger(notificationModel))
    }));
};
