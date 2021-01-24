import { Member } from './Member';
import { Passphrase } from './Passphrase';
import { CalendarKey } from './CalendarKey';

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

export interface CalendarUserSettings {
    DefaultCalendarID: string | null;
    WeekLength: number;
    DisplayWeekNumber: number;
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
    Keys: CalendarKey[];
    Passphrase: Passphrase;
    Members: Member[];
    CalendarSettings: CalendarSettings;
}
