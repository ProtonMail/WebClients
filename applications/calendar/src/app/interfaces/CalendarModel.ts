import { NotificationModel } from './NotificationModel';

export interface CalendarAddressOptions {
    value: string;
    text: string;
}

export interface CalendarModel {
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
    _emailPartDayNotifications: NotificationModel[];
    _emailFullDayNotifications: NotificationModel[];
}

export interface CalendarErrors {
    name?: string;
    description?: string;
}
