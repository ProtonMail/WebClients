import type { Attachment, AttachmentId } from '../../types';

// Temporary storage for attachments with full data before they're persisted to IndexedDB
// This avoids storing non-serializable Uint8Array in Redux actions
const pendingAttachmentsMap = new Map<AttachmentId, Attachment>();

export const storePendingAttachment = (attachment: Attachment): void => {
    pendingAttachmentsMap.set(attachment.id, attachment);
};

export const getPendingAttachment = (attachmentId: AttachmentId): Attachment | undefined => {
    return pendingAttachmentsMap.get(attachmentId);
};

export const removePendingAttachment = (attachmentId: AttachmentId): void => {
    pendingAttachmentsMap.delete(attachmentId);
};

export const clearPendingAttachments = (): void => {
    pendingAttachmentsMap.clear();
};
