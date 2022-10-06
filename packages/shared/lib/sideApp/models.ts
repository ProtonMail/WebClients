import { Environment } from '@proton/shared/lib/environment/helper';

import { User as tsUser } from '../interfaces';
import { ThemeTypes } from '../themes/themes';

export enum SIDE_APP_EVENTS {
    // Global inside iframe events
    SIDE_APP_CLOSE = 'close',
    SIDE_APP_SWITCH = 'switch',
    SIDE_APP_READY = 'ready',
    SIDE_APP_SESSION = 'session',
    SIDE_APP_API_REQUEST = 'api-request',
    SIDE_APP_API_RESPONSE = 'api-response',
    SIDE_APP_ABORT_REQUEST = 'api-request-abort',

    // Global outside iframe events
    SIDE_APP_CLOSE_FROM_OUTSIDE = 'outside-close',
    SIDE_APP_SWITCH_FROM_OUTSIDE = 'outside-switch',
    SIDE_APP_CALL_EVENT_MANAGER_FROM_OUTSIDE = 'outside-call-event-manager',
    SIDE_APP_UPDATE_THEME = 'outside-update-theme',

    // Calendar inside iframe events

    // Calendar outside iframe events
    SIDE_APP_CALENDAR_OPEN_EVENT = 'outside-calendar-open-event',
    SIDE_APP_CALL_CALENDAR_EVENT_MANAGER = 'outside-call-calendar-event-manager',
    SIDE_APP_SET_WIDGET_EVENT = 'outside-set-widget-event',
    SIDE_APP_UNSET_WIDGET_EVENT = 'outside-unset-widget-event',

    // Calendar to mail events
    SIDE_APP_REQUEST_OPEN_EVENTS = 'outside-request-open-events',
    SIDE_APP_REFRESH_WIDGET = 'outside-refresh-widget',
}

// Global inside iframe events
interface CLOSE {
    type: SIDE_APP_EVENTS.SIDE_APP_CLOSE;
    payload?: {
        url: string;
        app: string;
        closeDefinitely?: boolean;
    };
}

interface SWITCH {
    type: SIDE_APP_EVENTS.SIDE_APP_SWITCH;
    payload: {
        url: string;
        app: string;
        nextUrl?: string;
    };
}

interface READY {
    type: SIDE_APP_EVENTS.SIDE_APP_READY;
}

interface SESSION {
    type: SIDE_APP_EVENTS.SIDE_APP_SESSION;
    payload: {
        UID: string;
        keyPassword?: string;
        User: tsUser;
        persistent: boolean;
        trusted: boolean;
        tag?: Environment;
    };
}

interface API_REQUEST {
    type: SIDE_APP_EVENTS.SIDE_APP_API_REQUEST;
    payload: {
        id: string;
        arg: object;
        hasAbortController?: boolean;
    };
}

interface API_RESPONSE {
    type: SIDE_APP_EVENTS.SIDE_APP_API_RESPONSE;
    payload: {
        id: string;
        success: boolean;
        isApiError?: boolean;
        data: any;
        serverTime: Date;
    };
}

interface API_ABORT_REQUEST {
    type: SIDE_APP_EVENTS.SIDE_APP_ABORT_REQUEST;
    payload: {
        id: string;
    };
}

// Global outside iframe events
interface CLOSE_OUTSIDE {
    type: SIDE_APP_EVENTS.SIDE_APP_CLOSE_FROM_OUTSIDE;
    payload?: {
        closeDefinitely: boolean;
    };
}

interface SWITCH_OUTSIDE {
    type: SIDE_APP_EVENTS.SIDE_APP_SWITCH_FROM_OUTSIDE;
    payload: {
        nextUrl: string;
    };
}

interface CALL_EVENT_MANAGER_OUTSIDE {
    type: SIDE_APP_EVENTS.SIDE_APP_CALL_EVENT_MANAGER_FROM_OUTSIDE;
}

interface SIDE_APP_UPDATE_THEME {
    type: SIDE_APP_EVENTS.SIDE_APP_UPDATE_THEME;
    payload: {
        theme: ThemeTypes;
    };
}

// Calendar inside iframe events

// Calendar outside iframe events
interface CALENDAR_OPEN_EVENT {
    type: SIDE_APP_EVENTS.SIDE_APP_CALENDAR_OPEN_EVENT;
    payload: {
        calendarID: string;
        eventID: string;
        recurrenceID?: number;
    };
}

interface CALENDAR_CALL_EVENT_MANAGER {
    type: SIDE_APP_EVENTS.SIDE_APP_CALL_CALENDAR_EVENT_MANAGER;
    payload: {
        calendarID: string;
    };
}

interface SET_WIDGET_EVENT {
    type: SIDE_APP_EVENTS.SIDE_APP_SET_WIDGET_EVENT;
    payload: {
        messageID: string;
        UID: string;
    };
}

interface UNSET_WIDGET_EVENT {
    type: SIDE_APP_EVENTS.SIDE_APP_UNSET_WIDGET_EVENT;
    payload: {
        messageID: string;
        UID: string;
    };
}

interface REQUEST_OPEN_EVENTS {
    type: SIDE_APP_EVENTS.SIDE_APP_REQUEST_OPEN_EVENTS;
}

interface REFRESH_WIDGET {
    type: SIDE_APP_EVENTS.SIDE_APP_REFRESH_WIDGET;
    payload: {
        UID: string;
        ModifyTime: number;
    };
}

export type SIDE_APP_ACTION =
    | CLOSE
    | SWITCH
    | READY
    | SESSION
    | API_REQUEST
    | API_RESPONSE
    | API_ABORT_REQUEST
    | CLOSE_OUTSIDE
    | SWITCH_OUTSIDE
    | CALL_EVENT_MANAGER_OUTSIDE
    | SIDE_APP_UPDATE_THEME
    | CALENDAR_OPEN_EVENT
    | CALENDAR_CALL_EVENT_MANAGER
    | SET_WIDGET_EVENT
    | UNSET_WIDGET_EVENT
    | REQUEST_OPEN_EVENTS
    | REFRESH_WIDGET;
