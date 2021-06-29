import { LinkType } from './link';

export enum TransferState {
    Pending = 'pending',
    Initializing = 'initializing',
    Conflict = 'conflict',
    Progress = 'progress',
    Finalizing = 'finalizing',
    Done = 'done',
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

export class TransferConflict extends Error {
    constructor(options: { id: string } | { message: string }) {
        super('id' in options ? `Transfer ${options.id} is conflicting` : options.message);
        this.name = 'TransferConflict';
    }
}

export interface PreUploadData {
    file: File;
    ShareID: string;
    ParentLinkID: string | Promise<string>;
}

export interface Upload {
    id: string;
    meta: TransferMeta;
    preUploadData: PreUploadData;
    state: TransferState;
    startDate: Date;
    resumeState?: TransferState;
    error?: Error;
    ready?: boolean;
}

export interface DownloadInfo {
    LinkID: string;
    ShareID: string;
}

export interface Download {
    id: string;
    meta: TransferMeta;
    downloadInfo: DownloadInfo;
    state: TransferState;
    type: LinkType;
    startDate: Date;
    resumeState?: TransferState;
    error?: Error;
}

export interface PartialDownload extends Download {
    partOf: string;
}

export type Transfer = Upload | Download;
