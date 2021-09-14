import { TransferState, TransferMeta } from '../../../interfaces/transfer';
import { TransferConflictStrategy } from '../interface';

interface LinkUpload {
    // ID of the upload for referencing (such as pausing and so on).
    id: string;

    // IDs to where the link should be uploaded. Share link ID is always known,
    // but parent link ID might be empty if user uploads new struct which needs
    // to be crated first.
    shareId: string;
    parentId?: string;

    startDate: Date;
    state: TransferState;
    resumeState?: TransferState;
    error?: Error;
}

export interface FileUpload extends LinkUpload {
    file: File;
    meta: TransferMeta; // To be compatible with Upload of TransferManager.
}

export interface FileUploadReady extends FileUpload {
    parentId: string;
}

export interface FolderUpload extends LinkUpload {
    name: string;
    meta: TransferMeta; // To be compatible with Upload of TransferManager.
    linkId?: string;
    originalIsFolder?: boolean;

    files: FileUpload[];
    folders: FolderUpload[];
}

export interface FolderUploadReady extends FolderUpload {
    parentId: string;
}

export interface UploadQueue {
    shareId: string;
    parentId: string;
    files: FileUpload[];
    folders: FolderUpload[];
}

export type UpdateFilter = string | ((params: UpdateCallbackParams) => boolean);
export type UpdateState = TransferState | ((params: UpdateCallbackParams) => TransferState);
export type UpdateCallback = (params: UpdateCallbackParams) => void;
export type UpdateData = {
    mimeType?: string;
    name?: string;
    error?: Error;
    folderId?: string;
    isNewFolder?: boolean;
    originalIsFolder?: boolean;
};
export type UpdateCallbackParams = {
    id: string;
    state: TransferState;
    resumeState?: TransferState;
    parentId?: string;
};

export type ConflictStrategyHandler = (
    abortSignal: AbortSignal,
    originalIsFolder?: boolean
) => Promise<TransferConflictStrategy>;

export class UploadUserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UploadUserError';
    }
}
