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
    PLANNING = 4
}

export enum SETTINGS_WEEK_START {
    MONDAY = 1,
    SATURDAY = 6,
    SUNDAY = 7
}

export enum SETTINGS_DATE_FORMAT {
    DDMMYYYY = 0,
    MMDDYYYY = 1,
    YYYYMMDD = 2
}

export enum SETTINGS_TIME_FORMAT {
    H24 = 0,
    H12 = 1
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
    DEVICE = 1
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
