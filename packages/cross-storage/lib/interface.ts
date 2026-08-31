export interface ResponseMessage<T> {
    type: 'response';
    status: 'success' | 'error';
    id: number;
    payload: T | Error;
}

interface Message<T> {
    type: 'message';
    id: number;
    payload: T;
}

interface InitMessage {
    type: 'init';
    payload: {
        value: string | undefined | null;
    };
}

export type CrossStorageMessage = InitMessage | Message<any> | ResponseMessage<any>;
