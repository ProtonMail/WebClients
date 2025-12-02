export enum MessageType {
    INIT = 'init',
    ADD_CHUNK = 'addChunk',
    CLOSE_HANDLES = 'closeHandles',
    CLEAR = 'clear',
    CLOSE = 'close',
}

export type WorkerMessage = {
    type: MessageType;
    id: string;
    data?: any;
};

export enum WorkerResponseType {
    SUCCESS = 'success',
    ERROR = 'error',
    PROGRESS = 'progress',
}

export interface WorkerResponse {
    type: WorkerResponseType;
    id: string;
    data?: any;
    error?: string;
}
