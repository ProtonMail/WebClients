import { CalendarNotificationSettings } from 'proton-shared/lib/interfaces/calendar';
import { fromTriggerString } from 'proton-shared/lib/calendar/vcal';
import { triggerToModel } from '../components/eventModal/eventForm/notificationModel';
import { filterFutureNotifications } from './alarms';

export const notificationsToModel = (notifications: CalendarNotificationSettings[] = [], isAllDay: boolean) => {
    const modelNotifications = notifications.map(({ Type, Trigger }) =>
        triggerToModel({
            isAllDay,
            type: Type,
            trigger: fromTriggerString(Trigger),
        })
    );
    // Filter out future alarms
    return filterFutureNotifications(modelNotifications);
};
