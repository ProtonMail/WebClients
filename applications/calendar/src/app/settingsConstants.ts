import {
    SETTINGS_DATE_FORMAT,
    SETTINGS_NOTIFICATION_TYPE,
    SETTINGS_TIME_FORMAT,
    SETTINGS_VIEW,
    SETTINGS_WEEK_START
} from 'proton-shared/lib/interfaces/calendar';

export const DEFAULT_USER_SETTINGS = {
    WeekStart: SETTINGS_WEEK_START.MONDAY,
    WeekLength: 7,
    DisplayWeekNumber: 0,
    DateFormat: SETTINGS_DATE_FORMAT.YYYYMMDD,
    TimeFormat: SETTINGS_TIME_FORMAT.H24,
    AutoDetectPrimaryTimezone: 0,
    PrimaryTimezone: 'Europe/Zurich',
    DisplaySecondaryTimezone: 0,
    SecondaryTimezone: null,
    ViewPreference: SETTINGS_VIEW.WEEK
};

export const DEFAULT_PART_DAY_NOTIFICATIONS = [
    {
        Type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
        Trigger: '-PT15M'
    }
];

export const DEFAULT_FULL_DAY_NOTIFICATIONS = [
    {
        Type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
        Trigger: '-PT15H'
    }
];
