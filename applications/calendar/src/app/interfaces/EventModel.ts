import {
    ICAL_ATTENDEE_ROLE,
    DAILY_TYPE,
    END_TYPE,
    FREQUENCY,
    MONTHLY_TYPE,
    WEEKLY_TYPE,
    YEARLY_TYPE,
    ICAL_ATTENDEE_STATUS,
    ICAL_ATTENDEE_RSVP,
    ICAL_EVENT_STATUS,
} from 'proton-shared/lib/calendar/constants';
import { EVENT_VERIFICATION_STATUS } from 'proton-shared/lib/calendar/interface';
import { Address } from 'proton-shared/lib/interfaces';
import { VcalRrulePropertyValue } from 'proton-shared/lib/interfaces/calendar/VcalModel';
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
    rruleValue?: VcalRrulePropertyValue;
}

export interface DateTimeModel {
    date: Date;
    time: Date;
    tzid: string;
}

export interface OrganizerModel {
    email: string;
    cn: string;
}

export interface AttendeeModel {
    email: string;
    cn: string;
    rsvp: ICAL_ATTENDEE_RSVP;
    role: ICAL_ATTENDEE_ROLE;
    partstat: ICAL_ATTENDEE_STATUS;
    token?: string;
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
    sequence?: number;
    start: DateTimeModel;
    end: DateTimeModel;
    attendees: AttendeeModel[];
    organizer?: OrganizerModel;
    isOrganizer: boolean;
    selfAttendeeIndex?: number;
    selfAddress?: Address;
    status: ICAL_EVENT_STATUS;
    verificationStatus: EVENT_VERIFICATION_STATUS;
    rest?: any;
}

export interface EventModel extends EventModelView {
    // these types will be used in the future, for now only event is used
    type: 'event' | 'alarm' | 'task';
    calendar: CalendarModel;
    calendars: CalendarsModel[];
    member: {
        memberID: string;
        addressID: string;
    };
    isAllDay: boolean;
    isOrganizer: boolean;
    defaultPartDayNotification: NotificationModel;
    defaultFullDayNotification: NotificationModel;
    fullDayNotifications: NotificationModel[];
    partDayNotifications: NotificationModel[];
    initialDate: Date;
    initialTzid: string;
    defaultEventDuration: number;
    hasTouchedRrule: boolean;
    hasTouchedNotifications: {
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
    notifications?: {
        fields: number[];
        text: string;
    };
}

export interface EventModelReadView extends EventModelView {
    notifications: NotificationModel[];
    isAllDay: boolean;
}
