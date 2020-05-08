import { DAILY_TYPE, END_TYPE, FREQUENCY, MONTHLY_TYPE, WEEKLY_TYPE, YEARLY_TYPE } from '../constants';
import { NotificationModel } from './NotificationModel';

export interface FrequencyModel {
    type: FREQUENCY;
    frequency: FREQUENCY;
    interval?: number;
    daily: {
        type: DAILY_TYPE;
    };
    weekly: {
        type: WEEKLY_TYPE;
        days: number[];
    };
    monthly: {
        type: MONTHLY_TYPE;
    };
    yearly: {
        type: YEARLY_TYPE;
    };
    ends: {
        type: END_TYPE;
        count?: number;
        until?: Date;
    };
}

// todo
export interface AttendeeModel {
    name: string;
    email: string;
    permissions: any;
    rsvp: string;
}

export interface DateTimeModel {
    date: Date;
    time: Date;
    tzid: string;
}

export interface CalendarModel {
    id: string;
    color: string;
}

export interface CalendarsModel {
    text: string;
    value: string;
    color: string;
}

export interface EventModelView {
    uid?: string;
    frequencyModel: FrequencyModel;
    title: string;
    location: string;
    description: string;
    start: DateTimeModel;
    end: DateTimeModel;
    rest?: any;
}

export interface EventModel extends EventModelView {
    type: 'event' | 'alarm' | 'task';
    calendar: CalendarModel;
    calendars: CalendarsModel[];
    member: {
        memberID: string;
        addressID: string;
    };
    //attendees: AttendeeModel[];
    attendees?: any;
    isAllDay: boolean;
    defaultPartDayNotification: NotificationModel;
    defaultFullDayNotification: NotificationModel;
    fullDayNotifications: NotificationModel[];
    partDayNotifications: NotificationModel[];
    initialDate: Date;
    initialTzid: string;
    defaultEventDuration: number;
    hasMoreOptions?: boolean;
    hasCalendarRow: boolean;
    hasFrequencyRow: boolean;
    hasModifiedNotifications: {
        partDay: boolean;
        fullDay: boolean;
    };
}

export interface EventModelErrors {
    title?: string;
    end?: string;
    interval?: string;
    until?: string;
    count?: string;
}

export interface EventModelReadView extends EventModelView {
    notifications: NotificationModel[];
    isAllDay: boolean;
}
