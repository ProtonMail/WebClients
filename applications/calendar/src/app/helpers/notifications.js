import { c, msgid } from 'ttag';
import { fromTriggerString, toTriggerString } from 'proton-shared/lib/calendar/vcal';
import { triggerToModel } from '../components/eventModal/eventForm/propertiesToModel';
import { getValarmTrigger } from '../components/eventModal/eventForm/modelToProperties';
import { NOTIFICATION_TYPE, NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '../constants';
import { fromLocalDate, toUTCDate } from 'proton-shared/lib/date/timezone';

const { MINUTES, HOURS, DAY, WEEK } = NOTIFICATION_UNITS;
const { BEFORE, AFTER } = NOTIFICATION_WHEN;

export const getNotificationString = (notification, formatTime) => {
    const { value, unit, when, at, isAllDay } = notification;
    const modifiedAt = isAllDay ? toUTCDate(fromLocalDate(at)) : undefined;
    if (!isAllDay) {
        if (when === BEFORE) {
            if (unit === MINUTES) {
                return c('Notifications').ngettext(msgid`${value} minute before`, `${value} minutes before`, value);
            }
            if (unit === HOURS) {
                return c('Notifications').ngettext(msgid`${value} hour before`, `${value} hours before`, value);
            }
            if (unit === DAY) {
                return c('Notifications').ngettext(msgid`${value} day before`, `${value} days before`, value);
            }
            if (unit === WEEK) {
                return c('Notifications').ngettext(msgid`${value} week before`, `${value} weeks before`, value);
            }
        }
        if (when === AFTER) {
            if (unit === MINUTES) {
                return c('Notifications').ngettext(msgid`${value} minute after`, `${value} minutes after`, value);
            }
            if (unit === HOURS) {
                return c('Notifications').ngettext(msgid`${value} hour after`, `${value} hours after`, value);
            }
            if (unit === DAY) {
                return c('Notifications').ngettext(msgid`${value} day after`, `${value} days after`, value);
            }
            if (unit === WEEK) {
                return c('Notifications').ngettext(msgid`${value} week after`, `${value} weeks after`, value);
            }
        }
    }
    const time = formatTime(modifiedAt);
    if (when === BEFORE) {
        if (unit === MINUTES) {
            return c('Notifications').ngettext(
                msgid`${value} minute before at ${time}`,
                `${value} minutes before at ${time}`,
                value
            );
        }
        if (unit === HOURS) {
            return c('Notifications').ngettext(
                msgid`${value} hour before at ${time}`,
                `${value} hours before at ${time}`,
                value
            );
        }
        if (unit === DAY) {
            return c('Notifications').ngettext(
                msgid`${value} day before at ${time}`,
                `${value} days before at ${time}`,
                value
            );
        }
        if (unit === WEEK) {
            return c('Notifications').ngettext(
                msgid`${value} week before at ${time}`,
                `${value} weeks before at ${time}`,
                value
            );
        }
    }
    if (when === AFTER) {
        if (unit === MINUTES) {
            return c('Notifications').ngettext(
                msgid`${value} minute after at ${time}`,
                `${value} minutes after at ${time}`,
                value
            );
        }
        if (unit === HOURS) {
            return c('Notifications').ngettext(
                msgid`${value} hour after at ${time}`,
                `${value} hours after at ${time}`,
                value
            );
        }
        if (unit === DAY) {
            return c('Notifications').ngettext(
                msgid`${value} day after at ${time}`,
                `${value} days after at ${time}`,
                value
            );
        }
        if (unit === WEEK) {
            return c('Notifications').ngettext(
                msgid`${value} week after at ${time}`,
                `${value} weeks after at ${time}`,
                value
            );
        }
    }
};

export const notificationsToModel = (notifications = [], isAllDay) => {
    return notifications.map(({ Type, Trigger }) =>
        triggerToModel({
            isAllDay,
            type: Type,
            trigger: fromTriggerString(Trigger)
        })
    );
};

export const modelToNotifications = (notifications = []) => {
    return notifications.map(({ type, ...rest }) => ({
        Type: type,
        Trigger: toTriggerString(getValarmTrigger(rest))
    }));
};

export const DEFAULT_PART_DAY_NOTIFICATION = triggerToModel({
    isAllDay: false,
    type: NOTIFICATION_TYPE.DEVICE,
    trigger: fromTriggerString('-PT15M')
});

export const DEFAULT_FULL_DAY_NOTIFICATION = triggerToModel({
    isAllDay: true,
    type: NOTIFICATION_TYPE.DEVICE,
    trigger: fromTriggerString('-PT15H')
});

export const DEFAULT_PART_DAY_NOTIFICATIONS = [
    {
        Type: NOTIFICATION_TYPE.DEVICE,
        Trigger: '-PT15M'
    }
];

export const DEFAULT_FULL_DAY_NOTIFICATIONS = [
    {
        Type: NOTIFICATION_TYPE.DEVICE,
        Trigger: '-PT15H'
    }
];

export const getDeviceNotifications = (notifications) => {
    return notifications.filter(({ type }) => type === NOTIFICATION_TYPE.DEVICE);
};
