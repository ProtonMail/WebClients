export enum Action {
    getLocalStorage = 'getLocalStorage',
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

export type ProtonMessages = GetLocalStorageMessage | SetLocalStorageMessage | RemoveLocalStorageMessage;

export type ProtonMessageResponses =
    | GetLocalStorageMessageResponse
    | SetLocalStorageMessageResponse
    | RemoveLocalStorageMessageResponse;
