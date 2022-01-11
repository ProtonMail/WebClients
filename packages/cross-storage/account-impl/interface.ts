export enum Action {
    getLocalStorage = 'getLocalStorage',
    getLocalStorageKeys = 'getLocalStorageKeys',
    setLocalStorage = 'setLocalStorage',
    removeLocalStorage = 'removeLocalStorage',
}

export interface GetLocalStorageMessage {
    type: Action.getLocalStorage;
    payload: {
        key: string;
    };
}

export type GetLocalStorageMessageResponse = string | null | undefined;

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
    | RemoveLocalStorageMessage;

export type ProtonMessageResponses =
    | GetLocalStorageMessageResponse
    | GetLocalStorageKeysMessageResponse
    | SetLocalStorageMessageResponse
    | RemoveLocalStorageMessageResponse;
