import type { ATTACHMENT_DISPOSITION } from '@proton/shared/lib/mail/constants';

import type { UploadResult } from 'proton-mail/helpers/attachment/attachmentUploader';
import type { Upload } from 'proton-mail/helpers/upload';

export type AttachmentUpload = {
    file: File;
    upload: Upload<UploadResult>;
};

export type DummyAttachmentUpload = {
    file: File;
    isDummy: boolean;
};

export type PendingUpload = AttachmentUpload | DummyAttachmentUpload;

export interface AddAttachementsParams {
    action: ATTACHMENT_DISPOSITION;
    files: File[];
    removeImageMetadata?: boolean;
}

export interface StartAddAttachmentsParams {
    files: File[];
}
