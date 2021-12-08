import { TransferState, TransferMeta } from '@proton/shared/lib/interfaces/drive/transfer';

import { LinkDownload } from '../interface';

export interface Download {
    // ID of the download for referencing (such as pausing and so on).
    id: string;

    links: LinkDownload[];
    meta: TransferMeta; // To be compatible with Download of TransferManager.

    startDate: Date;
    state: TransferState;
    resumeState?: TransferState; // resumeState is set only when state is paused.
    error?: Error;
}

export type UpdateFilter = string | ((params: UpdateCallbackParams) => boolean);
export type UpdateState = TransferState | ((params: UpdateCallbackParams) => TransferState);
export type UpdateCallback = (params: UpdateCallbackParams) => void;
export type UpdateData = {
    size?: number;
    error?: Error;
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
