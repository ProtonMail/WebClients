import { CalendarNotificationSettings } from 'proton-shared/lib/interfaces/calendar';
import { fromTriggerString } from 'proton-shared/lib/calendar/vcal';
import { triggerToModel } from '../components/eventModal/eventForm/notificationModel';

export const notificationsToModel = (notifications: CalendarNotificationSettings[] = [], isAllDay: boolean) => {
    return notifications.map(({ Type, Trigger }) =>
        triggerToModel({
            isAllDay,
            type: Type,
            trigger: fromTriggerString(Trigger),
        })
    );
};
