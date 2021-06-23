import { SETTINGS_NOTIFICATION_TYPE } from '../../calendar/constants';
import { CalendarKey } from './CalendarKey';
import { Member } from './Member';
import { NotificationModel } from './Notification';
import { Passphrase } from './Passphrase';

export enum CALENDAR_TYPE {
    PERSONAL = 0,
    SUBSCRIPTION = 1,
}

export interface Calendar {
    ID: string;
    Name: string;
    Description: string;
    Display: 0 | 1;
    Color: string;
    Flags: number;
    Type: CALENDAR_TYPE;
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
    PrimaryTimezone: string;
    DisplaySecondaryTimezone: number;
    SecondaryTimezone?: string;
    ViewPreference: SETTINGS_VIEW;
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

export interface CalendarAddressOptions {
    value: string;
    text: string;
}

export interface CalendarViewModelFull {
    calendarID: string;
    name: string;
    display: boolean;
    description: string;
    color: string;
    addressID: string;
    addressOptions: CalendarAddressOptions[];
    duration: number;
    defaultPartDayNotification: NotificationModel;
    defaultFullDayNotification: NotificationModel;
    partDayNotifications: NotificationModel[];
    fullDayNotifications: NotificationModel[];
    url?: string;
    type: CALENDAR_TYPE;
}

export interface CalendarErrors {
    name?: string;
    description?: string;
}
