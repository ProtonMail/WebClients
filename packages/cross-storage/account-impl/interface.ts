export interface GetLocalStorageMessage {
    type: 'getLocalStorage';
    payload: {
        key: string;
    };
}

export type GetLocalStorageMessageResponse = string | null | undefined;

export interface SetLocalStorageMessage {
    type: 'setLocalStorage';
    payload: {
        key: string;
        value: string;
    };
}

export type SetLocalStorageMessageResponse = undefined;

export interface RemoveLocalStorageMessage {
    type: 'removeLocalStorage';
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
