import { EVENT_ACTIONS } from '../../constants';
import {
    Calendar,
    CalendarAlarm,
    CalendarEventWithoutBlob,
    CalendarMember,
    CalendarSubscription,
    CalendarUrl,
    CalendarWithOwnMembers,
} from './index';

export interface CalendarAlarmEventManagerDelete {
    ID: string;
    Action: EVENT_ACTIONS.DELETE;
}
export interface CalendarAlarmEventManagerUpdate {
    ID: string;
    Action: EVENT_ACTIONS.UPDATE;
    Alarm: CalendarAlarm;
}
export interface CalendarAlarmEventManagerCreate {
    ID: string;
    Action: EVENT_ACTIONS.CREATE;
    Alarm: CalendarAlarm;
}
export type CalendarAlarmEventManager =
    | CalendarAlarmEventManagerDelete
    | CalendarAlarmEventManagerUpdate
    | CalendarAlarmEventManagerCreate;

export interface CalendarUrlEventManagerDelete {
    ID: string;
    Action: EVENT_ACTIONS.DELETE;
}
export interface CalendarUrlEventManagerUpdate {
    ID: string;
    Action: EVENT_ACTIONS.UPDATE;
    CalendarUrl: CalendarUrl;
}
export interface CalendarUrlEventManagerCreate {
    ID: string;
    Action: EVENT_ACTIONS.CREATE;
    CalendarUrl: CalendarUrl;
}
export type CalendarUrlEventManager =
    | CalendarUrlEventManagerDelete
    | CalendarUrlEventManagerUpdate
    | CalendarUrlEventManagerCreate;

export interface CalendarSubscriptionEventManagerDelete {
    ID: string;
    Action: EVENT_ACTIONS.DELETE;
}
export interface CalendarSubscriptionEventManagerUpdate {
    ID: string;
    Action: EVENT_ACTIONS.UPDATE;
    CalendarSubscription: CalendarSubscription;
}
export interface CalendarSubscriptionEventManagerCreate {
    ID: string;
    Action: EVENT_ACTIONS.CREATE;
    CalendarSubscription: CalendarSubscription;
}
export type CalendarSubscriptionEventManager =
    | CalendarSubscriptionEventManagerDelete
    | CalendarSubscriptionEventManagerUpdate
    | CalendarSubscriptionEventManagerCreate;

export interface CalendarMemberEventManagerDelete {
    ID: string;
    Action: EVENT_ACTIONS.DELETE;
}
export interface CalendarMemberEventManagerUpdate {
    ID: string;
    Action: EVENT_ACTIONS.UPDATE;
    Member: CalendarMember;
}
export interface CalendarMemberEventManagerCreate {
    ID: string;
    Action: EVENT_ACTIONS.CREATE;
    Member: CalendarMember;
}

export type CalendarMemberEventManager =
    | CalendarMemberEventManagerDelete
    | CalendarMemberEventManagerUpdate
    | CalendarMemberEventManagerCreate;

export interface CalendarEventManagerDelete {
    ID: string;
    Action: EVENT_ACTIONS.DELETE;
}
export interface CalendarEventManagerUpdate {
    ID: string;
    Action: EVENT_ACTIONS.UPDATE;
    Calendar: Calendar;
}
export interface CalendarEventManagerCreate {
    ID: string;
    Action: EVENT_ACTIONS.CREATE;
    Calendar: CalendarWithOwnMembers;
}

export interface CalendarEventsEventManagerDelete {
    ID: string;
    Action: EVENT_ACTIONS.DELETE;
}
export interface CalendarEventsEventManagerUpdate {
    ID: string;
    Action: EVENT_ACTIONS.UPDATE;
    Event: CalendarEventWithoutBlob;
}
export interface CalendarEventsEventManagerCreate {
    ID: string;
    Action: EVENT_ACTIONS.CREATE;
    Event: CalendarEventWithoutBlob;
}
export type CalendarEventsEventManager =
    | CalendarEventsEventManagerDelete
    | CalendarEventsEventManagerUpdate
    | CalendarEventsEventManagerCreate;

export type CalendarEventManager = CalendarEventManagerCreate | CalendarEventManagerUpdate | CalendarEventManagerDelete;
