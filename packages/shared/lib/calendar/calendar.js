import { hasBit } from '../helpers/bitset';
import { CALENDAR_FLAGS } from './constants';

export const getIsCalendarActive = ({ Flags } = { Flags: 0 }) => {
    return hasBit(Flags, CALENDAR_FLAGS.ACTIVE);
};

export const getIsCalendarDisabled = ({ Flags } = { Flags: 0 }) => {
    return hasBit(Flags, CALENDAR_FLAGS.SELF_DISABLED) || hasBit(Flags, CALENDAR_FLAGS.SUPER_OWNER_DISABLED);
};

export const getIsCalendarProbablyActive = (calendar = {}) => {
    // Calendars are treated as "active" if flags are undefined, this can happen when a new calendar was created and received through the event manager.
    // In this case, we assume everything went well and treat it as an active calendar.
    return calendar.Flags === undefined || (!getIsCalendarDisabled(calendar) && getIsCalendarActive(calendar));
};

export const getProbablyActiveCalendars = (calendars = []) => {
    return calendars.filter(getIsCalendarProbablyActive);
};

export const getDefaultCalendar = (calendars = [], defaultCalendarID) => {
    if (!calendars.length) {
        return;
    }
    return calendars.find(({ ID }) => ID === defaultCalendarID) || calendars[0];
};
