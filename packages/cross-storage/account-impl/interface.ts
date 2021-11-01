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

export type ProtonMessages = GetLocalStorageMessage | SetLocalStorageMessage;
export type ProtonMessageResponses = GetLocalStorageMessageResponse | SetLocalStorageMessageResponse;
