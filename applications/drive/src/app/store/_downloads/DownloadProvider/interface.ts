import type { VERIFICATION_STATUS } from '@proton/crypto';

import type { TransferMeta, TransferState } from '../../../components/TransferManager/transfer';
import type { LinkDownload } from '../interface';

export interface Download {
    // ID of the download for referencing (such as pausing and so on).
    id: string;

    links: LinkDownload[];
    meta: TransferMeta; // To be compatible with Download of TransferManager.

    startDate: Date;
    state: TransferState;
    resumeState?: TransferState; // resumeState is set only when state is paused.
    error?: Error;
    // Signature link and status is set only when state is set to SignatureIssue.
    // Note that download can be of several links (for example the whole folder)
    // and only one of them can have signature issue. We need to know which one
    // exactly has the issue.
    signatureIssueLink?: LinkDownload;
    signatureStatus?: VERIFICATION_STATUS;
    scanIssueError?: Error;
    options?: { virusScan?: boolean };
    retries: number;
}

export interface DownloadProgresses {
    [downloadId: string]: {
        progress: number;
        links: DownloadLinksProgresses;
    };
}
export interface DownloadLinksProgresses {
    [linkId: string]: {
        total?: number;
        progress: number;
    };
}

export type UpdateFilter = string | ((params: UpdateCallbackParams) => boolean);
export type UpdateState = TransferState | ((params: UpdateCallbackParams) => TransferState);
export type UpdateCallback = (params: UpdateCallbackParams) => void;
export type UpdateData = {
    size?: number;
    error?: Error;
    signatureIssueLink?: LinkDownload;
    signatureStatus?: VERIFICATION_STATUS;
    scanIssueError?: Error;
    retry?: boolean;
};
export type UpdateCallbackParams = {
    id: string;
    state: TransferState;
    resumeState?: TransferState;
};

export class DownloadUserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DownloadUserError';
    }
}
