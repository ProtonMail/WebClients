import { NotificationModel } from '../../interfaces/NotificationModel';
import { EventModel } from '../../interfaces/EventModel';
import { getValarmTrigger } from '../../components/eventModal/eventForm/getValarmTrigger';
import { NOTIFICATION_UNITS } from '../../constants';
import { normalizeDurationToUnit } from '../../helpers/alarms';

const toMinutes = (notification: NotificationModel) => {
    const trigger = getValarmTrigger(notification);
    return normalizeDurationToUnit(trigger, NOTIFICATION_UNITS.MINUTES) * (trigger.isNegative ? -1 : 1);
};

export const sortNotifications = (items: NotificationModel[]) => items.sort((a, b) => toMinutes(a) - toMinutes(b));

export const sortEventModelNotifications = (event: EventModel) => ({
    ...event,
    fullDayNotifications: sortNotifications(event.fullDayNotifications),
    partDayNotifications: sortNotifications(event.partDayNotifications),
});
