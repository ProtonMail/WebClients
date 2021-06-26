import { fromLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { c, msgid } from 'ttag';
import { NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '@proton/shared/lib/calendar/constants';
import { NotificationModel } from '@proton/shared/lib/interfaces/calendar';

const getNotificationString = (notification: NotificationModel, formatTime: (date: Date) => string) => {
    const { value = 0, unit, when, at, isAllDay } = notification;

    if (!isAllDay || !at) {
        if (value === 0) {
            return c('Notifications').t`At time of event`;
        }

        if (when === NOTIFICATION_WHEN.BEFORE) {
            if (unit === NOTIFICATION_UNITS.MINUTES) {
                return c('Notifications').ngettext(msgid`${value} minute before`, `${value} minutes before`, value);
            }
            if (unit === NOTIFICATION_UNITS.HOURS) {
                return c('Notifications').ngettext(msgid`${value} hour before`, `${value} hours before`, value);
            }
            if (unit === NOTIFICATION_UNITS.DAY) {
                return c('Notifications').ngettext(msgid`${value} day before`, `${value} days before`, value);
            }
            if (unit === NOTIFICATION_UNITS.WEEK) {
                return c('Notifications').ngettext(msgid`${value} week before`, `${value} weeks before`, value);
            }
        }

        if (when === NOTIFICATION_WHEN.AFTER) {
            if (unit === NOTIFICATION_UNITS.MINUTES) {
                return c('Notifications').ngettext(msgid`${value} minute after`, `${value} minutes after`, value);
            }
            if (unit === NOTIFICATION_UNITS.HOURS) {
                return c('Notifications').ngettext(msgid`${value} hour after`, `${value} hours after`, value);
            }
            if (unit === NOTIFICATION_UNITS.DAY) {
                return c('Notifications').ngettext(msgid`${value} day after`, `${value} days after`, value);
            }
            if (unit === NOTIFICATION_UNITS.WEEK) {
                return c('Notifications').ngettext(msgid`${value} week after`, `${value} weeks after`, value);
            }
        }

        return c('Notifications').t`Unknown`;
    }

    const modifiedAt = toUTCDate(fromLocalDate(at));
    const time = formatTime(modifiedAt);

    if (value === 0) {
        return c('Notifications').t`On the same day at ${time}`;
    }

    if (when === NOTIFICATION_WHEN.BEFORE) {
        if (unit === NOTIFICATION_UNITS.MINUTES) {
            return c('Notifications').ngettext(
                msgid`${value} minute before at ${time}`,
                `${value} minutes before at ${time}`,
                value
            );
        }
        if (unit === NOTIFICATION_UNITS.HOURS) {
            return c('Notifications').ngettext(
                msgid`${value} hour before at ${time}`,
                `${value} hours before at ${time}`,
                value
            );
        }
        if (unit === NOTIFICATION_UNITS.DAY) {
            return c('Notifications').ngettext(
                msgid`${value} day before at ${time}`,
                `${value} days before at ${time}`,
                value
            );
        }
        if (unit === NOTIFICATION_UNITS.WEEK) {
            return c('Notifications').ngettext(
                msgid`${value} week before at ${time}`,
                `${value} weeks before at ${time}`,
                value
            );
        }
    }

    if (when === NOTIFICATION_WHEN.AFTER) {
        if (unit === NOTIFICATION_UNITS.MINUTES) {
            return c('Notifications').ngettext(
                msgid`${value} minute after at ${time}`,
                `${value} minutes after at ${time}`,
                value
            );
        }
        if (unit === NOTIFICATION_UNITS.HOURS) {
            return c('Notifications').ngettext(
                msgid`${value} hour after at ${time}`,
                `${value} hours after at ${time}`,
                value
            );
        }
        if (unit === NOTIFICATION_UNITS.DAY) {
            return c('Notifications').ngettext(
                msgid`${value} day after at ${time}`,
                `${value} days after at ${time}`,
                value
            );
        }
        if (unit === NOTIFICATION_UNITS.WEEK) {
            return c('Notifications').ngettext(
                msgid`${value} week after at ${time}`,
                `${value} weeks after at ${time}`,
                value
            );
        }
    }
};

export default getNotificationString;
