export enum TransferState {
    Initializing = 'initializing',
    Pending = 'pending',
    Progress = 'progress',
    Done = 'done',
    Canceled = 'canceled',
    Error = 'error'
}

export interface TransferProgresses {
    [id: string]: number;
}

export interface TransferMeta {
    filename: string;
    mimeType: string;
    size: number;
}

export class TransferCancel extends Error {
    constructor(id: string) {
        super(`Transfer ${id} canceled`);
        this.name = 'TransferCancel';
    }
}
