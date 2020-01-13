export enum TransferState {
    Pending = 'pending',
    Progress = 'progress',
    Done = 'done',
    Canceled = 'canceled',
    Error = 'error'
}

export interface TransferProgresses {
    [id: string]: number;
}
