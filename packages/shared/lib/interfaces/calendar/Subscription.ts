import { Calendar } from './Calendar';

export enum CALENDAR_SUBSCRIPTION_STATUS {
    OK = 0,
    ERROR = 1,
}

export interface CalendarSubscription {
    CalendarID: string;
    CreateTime: number;
    LastUpdateTime: number;
    Status: CALENDAR_SUBSCRIPTION_STATUS;
    URL: string;
}

export interface SubscribedCalendar extends Calendar {
    SubscriptionParameters: CalendarSubscription;
}

export interface CalendarSubscriptionResponse {
    CalendarSubscription: CalendarSubscription;
    Code: number;
}
