import { Calendar } from './Calendar';

export enum CALENDAR_SUBSCRIPTION_STATUS {
    OK = 0,
    ERROR = 1,
    INVALID_ICS = 2,
    CALENDAR_SOFT_DELETED = 3,
    CALENDAR_NOT_FOUND = 4,
    USER_NOT_EXIST = 5,
    ICS_SIZE_EXCEED_LIMIT = 6,
    SYNCHRONIZING = 7,
    CALENDAR_MISSING_PRIMARY_KEY = 8,
    HTTP_REQUEST_FAILED_GENERIC = 20,
    HTTP_REQUEST_FAILED_BAD_REQUEST = 21,
    HTTP_REQUEST_FAILED_UNAUTHORIZED = 22,
    HTTP_REQUEST_FAILED_FORBIDDEN = 23,
    HTTP_REQUEST_FAILED_NOT_FOUND = 24,
    HTTP_REQUEST_FAILED_INTERNAL_SERVER_ERROR = 25,
    HTTP_REQUEST_FAILED_TIMEOUT = 26,
    INTERNAL_CALENDAR_URL_NOT_FOUND = 27,
    INTERNAL_CALENDAR_UNDECRYPTABLE = 28,
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
