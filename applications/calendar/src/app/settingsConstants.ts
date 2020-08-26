import { SETTINGS_NOTIFICATION_TYPE, SETTINGS_VIEW, CalendarUserSettings } from 'proton-shared/lib/interfaces/calendar';

export const DEFAULT_CALENDAR_USER_SETTINGS: CalendarUserSettings = {
    WeekLength: 7,
    DisplayWeekNumber: 0,
    DefaultCalendarID: null,
    AutoDetectPrimaryTimezone: 0,
    PrimaryTimezone: 'Europe/Zurich',
    DisplaySecondaryTimezone: 0,
    SecondaryTimezone: undefined,
    ViewPreference: SETTINGS_VIEW.WEEK,
};

export const DEFAULT_PART_DAY_NOTIFICATIONS = [
    {
        Type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
        Trigger: '-PT15M',
    },
];

export const DEFAULT_FULL_DAY_NOTIFICATIONS = [
    {
        Type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
        Trigger: '-PT15H',
    },
];
