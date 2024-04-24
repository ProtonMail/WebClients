import { c, msgid } from 'ttag';

import { TransferMeta, TransferState } from '../../../components/TransferManager/transfer';
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
    resumeState?: TransferState; // resumeState is set only when state is paused.
    error?: Error;
    originalIsDraft?: boolean;

    isForPhotos?: boolean; // tell if the upload is for photos
}

export interface FileUpload extends LinkUpload {
    file: File;
    meta: TransferMeta; // To be compatible with Upload of TransferManager.
    originalIsFolder?: boolean;
}

export interface FileUploadReady extends FileUpload {
    parentId: string;
}

export interface FolderUpload extends LinkUpload {
    name: string;
    modificationTime?: Date;
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
    linkId: string;
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
    originalIsDraft?: boolean;
    originalIsFolder?: boolean;
};
export type UpdateCallbackParams = {
    id: string;
    state: TransferState;
    resumeState?: TransferState;
    parentId?: string;
    file?: File;
    isForPhotos?: boolean;
};

export type ConflictStrategyHandler = (
    abortSignal: AbortSignal,
    originalIsDraft?: boolean,
    originalIsFolder?: boolean
) => Promise<TransferConflictStrategy>;

export class UploadUserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UploadUserError';
    }
}
export class UploadConflictError extends Error {
    filename: string;

    constructor(filename: string, count: number = 0) {
        let message = c('Notification').t`File or folder "${filename}" is already uploading`;
        if (count) {
            message = c('Notification').ngettext(
                msgid`File or folder "${filename}" and ${count} other are already uploading`,
                `File or folder "${filename}" and ${count} others are already uploading`,
                count
            );
        }
        super(message);
        this.filename = filename;
        this.name = 'UploadConflictError';
    }
}
