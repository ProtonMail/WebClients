import { APPS } from '@proton/shared/lib/constants';
import { Environment } from '@proton/shared/lib/interfaces';

import { User as tsUser } from '../interfaces';
import { VCardContact } from '../interfaces/contacts/VCard';
import { ThemeSetting } from '../themes/themes';

export type DRAWER_APPS = typeof APPS.PROTONCALENDAR | typeof APPS.PROTONCONTACTS;
export type IframeSrcMap = Partial<Record<DRAWER_APPS, string | undefined>>;

export interface OpenDrawerArgs {
    app: DRAWER_APPS;
    path?: string;
}

export interface DrawerLocalStorageValue {
    userID: string;
    app: DRAWER_APPS;
    url?: string;
}

/**
 * Events sent from or to the drawer app
 */
export enum DRAWER_EVENTS {
    // Global inside iframe events
    CLOSE = 'close',
    SHOW = 'show',
    SWITCH = 'switch',
    READY = 'ready',
    SESSION = 'session',
    API_REQUEST = 'api-request',
    API_RESPONSE = 'api-response',
    ABORT_REQUEST = 'api-request-abort',
    CHILD_URL_UPDATE = 'child-url-update',

    // Global outside iframe events
    CALL_EVENT_MANAGER_FROM_OUTSIDE = 'outside-call-event-manager',
    UPDATE_THEME = 'outside-update-theme',

    // Calendar inside iframe events

    // Calendar outside iframe events
    CALENDAR_OPEN_EVENT = 'outside-calendar-open-event',
    CALL_CALENDAR_EVENT_MANAGER = 'outside-call-calendar-event-manager',
    SET_WIDGET_EVENT = 'outside-set-widget-event',
    UNSET_WIDGET_EVENT = 'outside-unset-widget-event',

    // Calendar to mail events
    REQUEST_OPEN_EVENTS = 'outside-request-open-events',
    REFRESH_WIDGET = 'outside-refresh-widget',
    OPEN_CONTACT_MODAL = 'open-contact-modal',
}

// Global inside iframe events
interface CLOSE {
    type: DRAWER_EVENTS.CLOSE;
    payload?: {
        app: DRAWER_APPS;
        closeDefinitely?: boolean;
    };
}

interface SHOW {
    type: DRAWER_EVENTS.SHOW;
}

interface SWITCH {
    type: DRAWER_EVENTS.SWITCH;
    payload: {
        nextUrl: string;
    };
}

interface READY {
    type: DRAWER_EVENTS.READY;
}

interface SESSION {
    type: DRAWER_EVENTS.SESSION;
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
    type: DRAWER_EVENTS.API_REQUEST;
    payload: {
        id: string;
        arg: object;
        hasAbortController?: boolean;
    };
}

interface API_RESPONSE {
    type: DRAWER_EVENTS.API_RESPONSE;
    payload: {
        id: string;
        success: boolean;
        isApiError?: boolean;
        data: any;
        serverTime: Date;
    };
}

interface API_ABORT_REQUEST {
    type: DRAWER_EVENTS.ABORT_REQUEST;
    payload: {
        id: string;
    };
}

interface CHILD_URL_UPDATE {
    type: DRAWER_EVENTS.CHILD_URL_UPDATE;
    payload: {
        url: string;
        app: DRAWER_APPS;
    };
}

// Global outside iframe events
interface CALL_EVENT_MANAGER_OUTSIDE {
    type: DRAWER_EVENTS.CALL_EVENT_MANAGER_FROM_OUTSIDE;
}

interface DRAWER_UPDATE_THEME {
    type: DRAWER_EVENTS.UPDATE_THEME;
    payload: {
        themeSetting: ThemeSetting;
    };
}

// Calendar inside iframe events

// Calendar outside iframe events
interface CALENDAR_OPEN_EVENT {
    type: DRAWER_EVENTS.CALENDAR_OPEN_EVENT;
    payload: {
        calendarID: string;
        eventID: string;
        recurrenceID?: number;
    };
}

interface CALENDAR_CALL_EVENT_MANAGER {
    type: DRAWER_EVENTS.CALL_CALENDAR_EVENT_MANAGER;
    payload: {
        calendarID: string;
    };
}

interface SET_WIDGET_EVENT {
    type: DRAWER_EVENTS.SET_WIDGET_EVENT;
    payload: {
        messageID: string;
        UID: string;
    };
}

interface UNSET_WIDGET_EVENT {
    type: DRAWER_EVENTS.UNSET_WIDGET_EVENT;
    payload: {
        messageID: string;
        UID: string;
    };
}

interface REQUEST_OPEN_EVENTS {
    type: DRAWER_EVENTS.REQUEST_OPEN_EVENTS;
}

interface REFRESH_WIDGET {
    type: DRAWER_EVENTS.REFRESH_WIDGET;
    payload: {
        UID: string;
        ModifyTime: number;
    };
}

type OPEN_CONTACT_MODAL =
    | {
          type: DRAWER_EVENTS.OPEN_CONTACT_MODAL;
          payload: {
              contactID: string;
          };
      }
    | {
          type: DRAWER_EVENTS.OPEN_CONTACT_MODAL;
          payload: {
              vCardContact: VCardContact;
          };
      };

export type DRAWER_ACTION =
    | CLOSE
    | SHOW
    | SWITCH
    | READY
    | SESSION
    | API_REQUEST
    | API_RESPONSE
    | API_ABORT_REQUEST
    | CHILD_URL_UPDATE
    | CALL_EVENT_MANAGER_OUTSIDE
    | DRAWER_UPDATE_THEME
    | CALENDAR_OPEN_EVENT
    | CALENDAR_CALL_EVENT_MANAGER
    | SET_WIDGET_EVENT
    | UNSET_WIDGET_EVENT
    | REQUEST_OPEN_EVENTS
    | REFRESH_WIDGET
    | OPEN_CONTACT_MODAL;
