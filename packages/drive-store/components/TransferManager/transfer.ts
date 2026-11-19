export enum TransferState {
    Initializing = 'initializing',
    Pending = 'pending',
    Conflict = 'conflict',
    SignatureIssue = 'signatureIssue',
    ScanIssue = 'scanIssue',
    Progress = 'progress',
    Finalizing = 'finalizing',
    Done = 'done',
    Skipped = 'skipped',
    Canceled = 'canceled',
    Error = 'error',
    NetworkError = 'networkError',
    Paused = 'paused',
}

export interface TransferMeta {
    linkId?: string;
    filename: string;
    mimeType: string;
    size?: number;
}

export class TransferCancel extends Error {
    constructor(options: { id: string } | { message: string }) {
        super('id' in options ? `Transfer ${options.id} canceled` : options.message);
        this.name = 'TransferCancel';
    }
}
