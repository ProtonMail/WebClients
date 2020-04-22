import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { Calendar, CalendarAlarm } from 'proton-shared/lib/interfaces/calendar';

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
    Calendar: Calendar;
}

export type CalendarEventManager = CalendarEventManagerCreate | CalendarEventManagerUpdate | CalendarEventManagerDelete;
