import { LinkType } from './link';

export enum TransferState {
    Initializing = 'initializing',
    Pending = 'pending',
    Progress = 'progress',
    Done = 'done',
    Canceled = 'canceled',
    Error = 'error',
    Paused = 'paused'
}

export interface TransferProgresses {
    [id: string]: number;
}

export interface TransferMeta {
    filename: string;
    mimeType: string;
    size?: number;
}

export class TransferCancel extends Error {
    constructor(id: string) {
        super(`Transfer ${id} canceled`);
        this.name = 'TransferCancel';
    }
}

export interface UploadInfo {
    blob: Blob;
    LinkID: string;
    ShareID: string;
    RevisionID: string;
    ParentLinkID: string;
}

export interface Upload {
    id: string;
    meta: TransferMeta;
    info?: UploadInfo;
    state: TransferState;
    startDate: Date;
}

export type Download = {
    id: string;
    meta: TransferMeta;
    state: TransferState;
    resumeState?: TransferState;
    type: LinkType;
    startDate: Date;
};

export type Transfer = Upload | Download;
