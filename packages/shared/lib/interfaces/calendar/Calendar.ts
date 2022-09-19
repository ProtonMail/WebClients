import { SETTINGS_NOTIFICATION_TYPE } from '../../calendar/constants';
import { Nullable } from '../utils';
import { CalendarKey } from './CalendarKey';
import { CalendarMember, CalendarOwner } from './CalendarMember';
import { NotificationModel } from './Notification';
import { Passphrase } from './Passphrase';

export enum CALENDAR_TYPE {
    PERSONAL = 0,
    SUBSCRIPTION = 1,
}

export enum CALENDAR_DISPLAY {
    HIDDEN = 0,
    VISIBLE = 1,
}

export interface Calendar {
    ID: string;
    Type: CALENDAR_TYPE;
}

export interface CalendarWithOwnMembers extends Calendar {
    Owner: CalendarOwner;
    Members: CalendarMember[];
}

export interface VisualCalendar extends CalendarWithOwnMembers {
    Name: string;
    Description: string;
    Color: string;
    Display: CALENDAR_DISPLAY;
    Email: string;
    Flags: number;
    Permissions: number;
}

export enum SETTINGS_VIEW {
    DAY = 0,
    WEEK = 1,
    MONTH = 2,
    YEAR = 3,
    PLANNING = 4,
}

export interface CalendarUserSettings {
    DefaultCalendarID: Nullable<string>;
    WeekLength: number;
    DisplayWeekNumber: number;
    AutoDetectPrimaryTimezone: number;
    PrimaryTimezone: string;
    DisplaySecondaryTimezone: number;
    SecondaryTimezone: Nullable<string>;
    ViewPreference: SETTINGS_VIEW;
    InviteLocale: Nullable<string>;
    AutoImportInvite: number;
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
    Members: CalendarMember[];
    CalendarSettings: CalendarSettings;
}

export interface CalendarAddressOptions {
    value: string;
    text: string;
}

export interface CalendarSelectOption {
    id: string;
    name: string;
    color: string;
}

export interface CalendarViewModelFull {
    calendarID: string;
    name: string;
    members: CalendarMember[];
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
