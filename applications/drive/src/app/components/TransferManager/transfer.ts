/* eslint-disable max-classes-per-file */

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
    constructor(options: { id: string } | { message: string }) {
        super('id' in options ? `Transfer ${options.id} skipped` : options.message);
        this.name = 'TransferSkipped';
    }
}

export class TransferConflict extends Error {
    constructor(options: { id: string } | { message: string }) {
        super('id' in options ? `Transfer ${options.id} is conflicting` : options.message);
        this.name = 'TransferConflict';
    }
}

export interface Upload {
    id: string;
    meta: TransferMeta;
    state: TransferState;
    startDate: Date;
    error?: Error;

    files?: Upload[];
    folders?: Upload[];
}

export interface Download {
    id: string;
    meta: TransferMeta;
    state: TransferState;
    startDate: Date;
    error?: Error;
    scanIssueError?: Error;
}

export interface PartialDownload extends Download {
    partOf: string;
}

export type Transfer = Upload | Download;

export interface ThumbnailMeta {
    modifyTime: number;
}

export type API = (query: any) => any;

export interface TransferHistoryStats {
    active: boolean;
    progress: number;
    speed: number;
}

export interface TransfersHistoryStats {
    timestamp: Date;
    stats: { [id: string]: TransferHistoryStats };
}

export interface TransferStats {
    progress: number;
    averageSpeed: number;
}

export interface TransfersStats {
    [id: string]: TransferStats;
}

export enum TransferType {
    Download = 'download',
    Upload = 'upload',
}

export enum TransferGroup {
    ACTIVE,
    DONE,
    QUEUED,
    FAILURE,
}

export const STATE_TO_GROUP_MAP = {
    [TransferState.Progress]: TransferGroup.ACTIVE,
    [TransferState.Finalizing]: TransferGroup.ACTIVE,
    [TransferState.Paused]: TransferGroup.ACTIVE,
    [TransferState.SignatureIssue]: TransferGroup.ACTIVE,
    [TransferState.ScanIssue]: TransferGroup.ACTIVE,
    [TransferState.Skipped]: TransferGroup.FAILURE,
    [TransferState.Canceled]: TransferGroup.FAILURE,
    [TransferState.NetworkError]: TransferGroup.FAILURE,
    [TransferState.Done]: TransferGroup.DONE,
    [TransferState.Error]: TransferGroup.FAILURE,
    [TransferState.Initializing]: TransferGroup.QUEUED,
    [TransferState.Conflict]: TransferGroup.QUEUED,
    [TransferState.Pending]: TransferGroup.QUEUED,
};
