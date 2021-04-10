import generateUID from '../helpers/generateUID';

import { filterFutureNotifications } from './alarms';
import { CalendarNotificationSettings } from '../interfaces/calendar';
import { triggerToModel } from './notificationModel';
import { fromTriggerString } from './vcal';

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
