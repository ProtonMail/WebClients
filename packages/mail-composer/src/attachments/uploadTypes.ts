import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import type { Packets } from '@proton/shared/lib/interfaces/mail/crypto';
import type { ATTACHMENT_DISPOSITION } from '@proton/shared/lib/mail/constants';

export interface Upload<T> {
    /**
     * Open reference to the actual XHR, but other fields should be more practical
     */
    xhr: XMLHttpRequest;

    /**
     * Add listener to the upload progress events
     */
    addProgressListener: (listener: (event: ProgressEvent) => void) => void;

    /**
     * Executing ths function will abort the current upload
     */
    abort: () => void;

    /**
     * Promise resolved at the end of the upload and containing the JSON content returned by the server
     */
    resultPromise: Promise<T>;
}

export interface UploadResult {
    attachment: Attachment;
    packets: Packets;
    addressID: string; // The addressID used to encrypt packets
}

export type AttachmentUpload = {
    file: File;
    upload: Upload<UploadResult>;
};

export type DummyAttachmentUpload = {
    file: File;
    isDummy: boolean;
};

export type PendingUpload = AttachmentUpload | DummyAttachmentUpload;

export interface AddAttachmentsParams {
    action: ATTACHMENT_DISPOSITION;
    /** When omitted, the hook falls back to the current pending files. */
    files?: File[];
    removeImageMetadata?: boolean;
    cid?: string;
}
