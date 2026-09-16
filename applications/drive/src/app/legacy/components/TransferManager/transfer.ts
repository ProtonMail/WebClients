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

interface TransferMeta {
    linkId?: string;
    filename: string;
    mimeType: string;
    size?: number;
}

export interface TransferSummary {
    size: number;
    progress: number;
}

interface Upload {
    id: string;
    meta: TransferMeta;
    state: TransferState;
    startDate: Date;
    error?: Error;

    files?: Upload[];
    folders?: Upload[];
}

interface Download {
    id: string;
    meta: TransferMeta;
    state: TransferState;
    startDate: Date;
    error?: Error;
}

export type Transfer = Upload | Download;

interface TransferStats {
    progress: number;
    averageSpeed: number;
}

export interface TransfersStats {
    [id: string]: TransferStats;
}
