import type { PersistedSessionLite } from '@proton/shared/lib/authentication/SessionInterface';
import type { APP_NAMES } from '@proton/shared/lib/constants';

export enum Action {
    getLocalStorage = 'getLocalStorage',
    getLocalStorageKeys = 'getLocalStorageKeys',
    setLocalStorage = 'setLocalStorage',
    removeLocalStorage = 'removeLocalStorage',
    sessions = 'sessions',
}

export interface GetLocalStorageMessage {
    type: Action.getLocalStorage;
    payload: {
        key: string;
    };
}

export type GetLocalStorageMessageResponse = string | null | undefined;

export interface SessionsMessage {
    type: Action.sessions;
    payload: {
        appName: APP_NAMES;
        type: 'minimal';
    };
}

export interface MinimalSessionsResponse {
    type: 'minimal';
    sessions: PersistedSessionLite[];
}

export type SessionsResponse = MinimalSessionsResponse;

export interface GetLocalStorageKeysMessage {
    type: Action.getLocalStorageKeys;
}

export type GetLocalStorageKeysMessageResponse = string[] | null | undefined;

export interface SetLocalStorageMessage {
    type: Action.setLocalStorage;
    payload: {
        key: string;
        value: string;
    };
}

export type SetLocalStorageMessageResponse = undefined;

export interface RemoveLocalStorageMessage {
    type: Action.removeLocalStorage;
    payload: {
        key: string;
    };
}

export type RemoveLocalStorageMessageResponse = undefined;

export type ProtonMessages =
    | GetLocalStorageMessage
    | GetLocalStorageKeysMessage
    | SetLocalStorageMessage
    | RemoveLocalStorageMessage
    | SessionsMessage;

export type ProtonMessageResponses =
    | GetLocalStorageMessageResponse
    | GetLocalStorageKeysMessageResponse
    | SetLocalStorageMessageResponse
    | RemoveLocalStorageMessageResponse
    | SessionsResponse;
