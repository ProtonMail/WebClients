import { Member } from './Member';
import { Passphrase } from './Passphrase';
import { Key } from './Key';

export interface Calendar {
    ID: string;
    Name: string;
    Description: string;
    Display: 0 | 1;
    Color: string;
    Flags: number;
}

export enum SETTINGS_VIEW {
    DAY = 0,
    WEEK = 1,
    MONTH = 2,
    YEAR = 3,
    PLANNING = 4,
}

export enum SETTINGS_WEEK_START {
    LOCALE_DEFAULT = 0,
    MONDAY = 1,
    SATURDAY = 6,
    SUNDAY = 7,
}

export enum SETTINGS_DATE_FORMAT {
    LOCALE_DEFAULT = 0,
    DDMMYYYY = 1,
    MMDDYYYY = 2,
    YYYYMMDD = 3,
}

export enum SETTINGS_TIME_FORMAT {
    LOCALE_DEFAULT = 0,
    H24 = 1,
    H12 = 2,
}

export interface CalendarUserSettings {
    DefaultCalendarID: string | null;
    WeekStart: SETTINGS_WEEK_START;
    WeekLength: number;
    DisplayWeekNumber: number;
    DateFormat: SETTINGS_DATE_FORMAT;
    TimeFormat: SETTINGS_TIME_FORMAT;
    AutoDetectPrimaryTimezone: number;
    PrimaryTimezone?: string;
    DisplaySecondaryTimezone: number;
    SecondaryTimezone?: string;
    ViewPreference: SETTINGS_VIEW;
}

export enum SETTINGS_NOTIFICATION_TYPE {
    EMAIL = 0,
    DEVICE = 1,
}

export interface CalendarNotificationSettings {
    Type: SETTINGS_NOTIFICATION_TYPE;
    Trigger: string;
}

export interface CalendarSettings {
    ID: string;
    CalendarID: string;
    DefaultEventDuration: number;
    DefaultPartDayNotifications: CalendarNotificationSettings[];
    DefaultFullDayNotifications: CalendarNotificationSettings[];
}

export interface CalendarBootstrap {
    Keys: Key[];
    Passphrase: Passphrase;
    Members: Member[];
    CalendarSettings: CalendarSettings;
}
