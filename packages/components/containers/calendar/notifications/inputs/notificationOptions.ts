import { c, msgid } from 'ttag';

import { NOTIFICATION_UNITS, NOTIFICATION_UNITS_MAX, NOTIFICATION_WHEN } from '@proton/shared/lib/calendar/constants';
import clamp from '@proton/utils/clamp';

export const getDaysBefore = (value: number) => ({
    text: c('Notification when').ngettext(msgid`day before`, `days before`, value),
    value: clamp(value, 1, NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.DAY]),
    unit: NOTIFICATION_UNITS.DAY,
    when: NOTIFICATION_WHEN.BEFORE,
});

export const getSameDay = () => ({
    text: c('Notification when').t`on the same day`,
    value: 0,
    unit: NOTIFICATION_UNITS.DAY,
    when: NOTIFICATION_WHEN.AFTER,
});

export const getSameTime = () => ({
    text: c('Notification when').t`at time of event`,
    value: 0,
    unit: NOTIFICATION_UNITS.MINUTE,
    when: NOTIFICATION_WHEN.AFTER,
});

export const getWeeksBefore = (value: number) => ({
    text: c('Notification when').ngettext(msgid`week before`, `weeks before`, value),
    value: clamp(value, 1, NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.WEEK]),
    unit: NOTIFICATION_UNITS.WEEK,
    when: NOTIFICATION_WHEN.BEFORE,
});

export const getMinutesBefore = (value: number) => ({
    text: c('Notification when').ngettext(msgid`minute before`, `minutes before`, value),
    value: clamp(value, 1, NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.MINUTE]),
    unit: NOTIFICATION_UNITS.MINUTE,
    when: NOTIFICATION_WHEN.BEFORE,
});

export const getHoursBefore = (value: number) => ({
    text: c('Notification when').ngettext(msgid`hour before`, `hours before`, value),
    value: clamp(value, 1, NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.HOUR]),
    unit: NOTIFICATION_UNITS.HOUR,
    when: NOTIFICATION_WHEN.BEFORE,
});
