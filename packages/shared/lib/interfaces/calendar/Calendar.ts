import { CALENDAR_DISPLAY, CALENDAR_TYPE, NOTIFICATION_TYPE_API, SETTINGS_VIEW } from '../../calendar/constants';
import { Nullable } from '../utils';
import { CalendarKey } from './CalendarKey';
import { CalendarMember, CalendarOwner } from './CalendarMember';
import { NotificationModel } from './Notification';
import { Passphrase } from './Passphrase';

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
    Priority: number;
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
    Type: NOTIFICATION_TYPE_API;
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

export interface HolidaysDirectoryCalendar {
    CalendarID: string;
    Country: string;
    CountryCode: string;
    Language: string;
    LanguageCode: string;
    Passphrase: string;
    SessionKey: {
        Key: string;
        Algorithm: string;
    };
    Timezones: string[];
}
