import { CalendarUserSettings, SETTINGS_VIEW } from '@proton/shared/lib/interfaces/calendar';
import { VIEWS } from '@proton/shared/lib/calendar/constants';

export const getAutoDetectPrimaryTimezone = (calendarUserSettings: CalendarUserSettings) => {
    return !!calendarUserSettings.AutoDetectPrimaryTimezone;
};

export const getDisplaySecondaryTimezone = (calendarUserSettings: CalendarUserSettings) => {
    return !!calendarUserSettings.DisplaySecondaryTimezone;
};

export const getSecondaryTimezone = (calendarUserSettings: CalendarUserSettings) => {
    return calendarUserSettings.SecondaryTimezone;
};

export const getDisplayWeekNumbers = (calendarUserSettings: CalendarUserSettings) => {
    return !!calendarUserSettings.DisplayWeekNumber;
};

export const getDefaultCalendarID = (calendarUserSettings: CalendarUserSettings) => {
    // DefaultCalendarID is either null or a string
    return calendarUserSettings.DefaultCalendarID || undefined;
};

export const getDefaultTzid = (calendarUserSettings: CalendarUserSettings, defaultTimezone: string) => {
    const primaryTimezone = calendarUserSettings.PrimaryTimezone;
    return primaryTimezone || defaultTimezone;
};

const SETTINGS_VIEW_CONVERSION = {
    [SETTINGS_VIEW.YEAR]: VIEWS.WEEK,
    [SETTINGS_VIEW.PLANNING]: VIEWS.WEEK,
    [SETTINGS_VIEW.MONTH]: VIEWS.MONTH,
    [SETTINGS_VIEW.WEEK]: VIEWS.WEEK,
    [SETTINGS_VIEW.DAY]: VIEWS.DAY,
};

export const getDefaultView = (calendarUserSettings: CalendarUserSettings) => {
    return SETTINGS_VIEW_CONVERSION[calendarUserSettings?.ViewPreference] || VIEWS.WEEK;
};
