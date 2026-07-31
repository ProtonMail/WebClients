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

export interface TransferProgresses {
    [id: string]: number;
}

export interface TransferMeta {
    linkId?: string;
    filename: string;
    mimeType: string;
    size?: number;
}

export interface TransferSummary {
    size: number;
    progress: number;
}

export class TransferCancel extends Error {
    constructor(options: { id: string } | { message: string }) {
        super('id' in options ? `Transfer ${options.id} canceled` : options.message);
        this.name = 'TransferCancel';
    }
}
export class TransferSkipped extends Error {
    duplicateLinkId?: string;

    file?: File;

    constructor(
        options:
            | { id: string; duplicateLinkId?: string; file?: File }
            | { message: string; duplicateLinkId?: string; file?: File }
    ) {
        super('id' in options ? `Transfer ${options.id} skipped` : options.message);
        this.name = 'TransferSkipped';
        this.duplicateLinkId = options.duplicateLinkId;
        this.file = options.file;
    }
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

interface TransferHistoryStats {
    active: boolean;
    progress: number;
    speed: number;
}

export interface TransfersHistoryStats {
    timestamp: Date;
    stats: { [id: string]: TransferHistoryStats };
}

interface TransferStats {
    progress: number;
    averageSpeed: number;
}

export interface TransfersStats {
    [id: string]: TransferStats;
}
