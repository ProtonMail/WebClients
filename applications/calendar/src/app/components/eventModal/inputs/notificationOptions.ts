import { c, msgid } from 'ttag';
import { clamp } from 'proton-shared/lib/helpers/math';
import { NOTIFICATION_UNITS, NOTIFICATION_UNITS_MAX, NOTIFICATION_WHEN } from '../../../constants';

export const getDaysBefore = (value: number) => ({
    text: c('Notification when').ngettext(msgid`day before`, `days before`, value),
    value: clamp(value, 1, NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.DAY]),
    unit: NOTIFICATION_UNITS.DAY,
    when: NOTIFICATION_WHEN.BEFORE
});

export const getDaysAfter = (value: number) => ({
    text: c('Notification when').ngettext(msgid`day after`, `days after`, value),
    value: clamp(value, 1, NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.DAY]),
    unit: NOTIFICATION_UNITS.DAY,
    when: NOTIFICATION_WHEN.AFTER
});

export const getSameDay = () => ({
    text: c('Notification when').t`on the same day`,
    value: 0,
    unit: NOTIFICATION_UNITS.DAY,
    when: NOTIFICATION_WHEN.AFTER
});

export const getSameTime = () => ({
    text: c('Notification when').t`at the same time`,
    value: 0,
    unit: NOTIFICATION_UNITS.MINUTES,
    when: NOTIFICATION_WHEN.AFTER
});

export const getWeeksBefore = (value: number) => ({
    text: c('Notification when').ngettext(msgid`week before`, `weeks before`, value),
    value: clamp(value, 1, NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.WEEK]),
    unit: NOTIFICATION_UNITS.WEEK,
    when: NOTIFICATION_WHEN.BEFORE
});

export const getWeeksAfter = (value: number) => ({
    text: c('Notification when').ngettext(msgid`week after`, `weeks after`, value),
    value: clamp(value, 1, NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.WEEK]),
    unit: NOTIFICATION_UNITS.WEEK,
    when: NOTIFICATION_WHEN.AFTER
});

export const getMinutesBefore = (value: number) => ({
    text: c('Notification when').ngettext(msgid`minute before`, `minutes before`, value),
    value: clamp(value, 1, NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.MINUTES]),
    unit: NOTIFICATION_UNITS.MINUTES,
    when: NOTIFICATION_WHEN.BEFORE
});

export const getMinutesAfter = (value: number) => ({
    text: c('Notification when').ngettext(msgid`minute after`, `minutes after`, value),
    value: clamp(value, 1, NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.MINUTES]),
    unit: NOTIFICATION_UNITS.MINUTES,
    when: NOTIFICATION_WHEN.AFTER
});

export const getHoursBefore = (value: number) => ({
    text: c('Notification when').ngettext(msgid`hour before`, `hours before`, value),
    value: clamp(value, 1, NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.HOURS]),
    unit: NOTIFICATION_UNITS.HOURS,
    when: NOTIFICATION_WHEN.BEFORE
});

export const getHoursAfter = (value: number) => ({
    text: c('Notification when').ngettext(msgid`hour after`, `hours after`, value),
    value: clamp(value, 1, NOTIFICATION_UNITS_MAX[NOTIFICATION_UNITS.HOURS]),
    unit: NOTIFICATION_UNITS.HOURS,
    when: NOTIFICATION_WHEN.AFTER
});
