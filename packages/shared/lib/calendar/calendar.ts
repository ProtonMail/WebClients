import { hasBit } from '../helpers/bitset';
import { unary } from '../helpers/function';
import { CALENDAR_FLAGS, MAX_CALENDARS_PER_FREE_USER, MAX_CALENDARS_PER_USER, SETTINGS_VIEW } from './constants';
import { Calendar, CalendarUserSettings } from '../interfaces/calendar';
import { getIsPersonalCalendar } from './subscribe/helpers';

export const getDoesCalendarNeedUserAction = ({ Flags }: Calendar) => {
    return hasBit(Flags, CALENDAR_FLAGS.RESET_NEEDED) || hasBit(Flags, CALENDAR_FLAGS.UPDATE_PASSPHRASE);
};

export const getIsCalendarActive = ({ Flags } = { Flags: 0 }) => {
    return hasBit(Flags, CALENDAR_FLAGS.ACTIVE);
};

export const getIsCalendarDisabled = ({ Flags } = { Flags: 0 }) => {
    return hasBit(Flags, CALENDAR_FLAGS.SELF_DISABLED) || hasBit(Flags, CALENDAR_FLAGS.SUPER_OWNER_DISABLED);
};

export const getIsCalendarProbablyActive = (calendar = { Flags: 0 }) => {
    // Calendars are treated as "active" if flags are undefined, this can happen when a new calendar was created and received through the event manager.
    // In this case, we assume everything went well and treat it as an active calendar.
    return calendar.Flags === undefined || (!getIsCalendarDisabled(calendar) && getIsCalendarActive(calendar));
};

export const getProbablyActiveCalendars = (calendars: Calendar[] = []) => {
    return calendars.filter(unary(getIsCalendarProbablyActive));
};

export const getPersonalCalendars = (calendars: Calendar[] = []) => {
    return calendars.filter(unary(getIsPersonalCalendar));
};

export const getDefaultCalendar = (calendars: Calendar[] = [], defaultCalendarID: string | null = '') => {
    // only personal calendars can be default
    const personalCalendars = getPersonalCalendars(calendars);
    if (!personalCalendars.length) {
        return;
    }
    return personalCalendars.find(({ ID }) => ID === defaultCalendarID) || personalCalendars[0];
};

export const getCanCreateCalendar = (
    activeCalendars: Calendar[],
    disabledCalendars: Calendar[],
    calendars: Calendar[],
    isFree: boolean
) => {
    const totalActionableCalendars = activeCalendars.length + disabledCalendars.length;
    if (totalActionableCalendars < calendars.length) {
        // calendar keys need to be reactivated before being able to create a calendar
        return false;
    }
    const calendarLimit = isFree ? MAX_CALENDARS_PER_FREE_USER : MAX_CALENDARS_PER_USER;
    return totalActionableCalendars < calendarLimit;
};

export const getMaxUserCalendarsDisabled = (disabledCalendars: Calendar[], isFree: boolean) => {
    const calendarLimit = isFree ? MAX_CALENDARS_PER_FREE_USER : MAX_CALENDARS_PER_USER;

    return disabledCalendars.length === calendarLimit;
};

export const DEFAULT_CALENDAR_USER_SETTINGS: CalendarUserSettings = {
    WeekLength: 7,
    DisplayWeekNumber: 1,
    DefaultCalendarID: null,
    AutoDetectPrimaryTimezone: 1,
    PrimaryTimezone: 'UTC',
    DisplaySecondaryTimezone: 0,
    SecondaryTimezone: undefined,
    ViewPreference: SETTINGS_VIEW.WEEK,
};
