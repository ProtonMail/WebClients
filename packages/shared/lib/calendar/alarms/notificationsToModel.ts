import generateUID from '@proton/atoms/generateUID';

import type { Nullable } from '../../interfaces';
import type { CalendarNotificationSettings, CalendarSettings } from '../../interfaces/calendar';
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

export const apiNotificationsToModel = ({
    notifications: apiNotifications,
    isAllDay,
    calendarSettings,
}: {
    notifications: Nullable<CalendarNotificationSettings[]>;
    isAllDay: boolean;
    calendarSettings: CalendarSettings;
}) => {
    const { DefaultPartDayNotifications, DefaultFullDayNotifications } = calendarSettings;
    const defaultNotifications = isAllDay ? DefaultFullDayNotifications : DefaultPartDayNotifications;

    return notificationsToModel(apiNotifications || defaultNotifications, isAllDay);
};
