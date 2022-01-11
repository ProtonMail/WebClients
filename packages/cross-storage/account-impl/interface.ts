export enum Action {
    getLocalStorage = 'getLocalStorage',
    getAllLocalStorage = 'getAllLocalStorage',
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

export interface GetAllLocalStorageMessage {
    type: Action.getAllLocalStorage;
}

export type GetAllLocalStorageMessageResponse = string[] | null | undefined;

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
    | GetAllLocalStorageMessage
    | SetLocalStorageMessage
    | RemoveLocalStorageMessage;

export type ProtonMessageResponses =
    | GetLocalStorageMessageResponse
    | GetAllLocalStorageMessageResponse
    | SetLocalStorageMessageResponse
    | RemoveLocalStorageMessageResponse;
