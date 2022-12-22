import generateUID from '../../helpers/generateUID';
import { CalendarNotificationSettings } from '../../interfaces/calendar';
import { filterFutureNotifications } from '../alarms';
import { fromTriggerString } from '../vcal';
import { triggerToModel } from './notificationModel';

export const notificationsToModel = (notifications: CalendarNotificationSettings[] = [], isAllDay: boolean) => {
    const modelNotifications = notifications.map(({ Type, Trigger }) => ({
        id: generateUID('notification'),
        ...triggerToModel({
            isAllDay,
            type: Type,
            trigger: fromTriggerString(Trigger),
        }),
    }));
    // Filter out future alarms
    return filterFutureNotifications(modelNotifications);
};
