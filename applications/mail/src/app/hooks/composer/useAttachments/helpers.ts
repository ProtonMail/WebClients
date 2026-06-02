import type { AttachmentUpload, DummyAttachmentUpload, PendingUpload } from './interface';

export const createDummyUpload = (file: File) => ({
    file,
    isDummy: true,
});

export const isDummyAttachmentUpload = (attachmentUpload: PendingUpload): attachmentUpload is DummyAttachmentUpload =>
    'isDummy' in attachmentUpload;
export const isAttachmentUpload = (attachmentUpload: PendingUpload): attachmentUpload is AttachmentUpload =>
    !isDummyAttachmentUpload(attachmentUpload);
