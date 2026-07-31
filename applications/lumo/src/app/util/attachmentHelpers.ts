/**
 * Attachment helper utilities
 * Centralizes attachment processing logic like token counting and Redux storage
 */
import { getApproximateTokenCount } from '../llm/tokenizer';
import { upsertAttachment } from '../redux/slices/core/attachments';
import type { LumoDispatch } from '../redux/store';
import { attachmentDataCache } from '../services/attachmentDataCache';
import type { Attachment, SpaceId } from '../types';

export function attachmentMatchesProjectFile(
    attachment: Pick<Attachment, 'filename' | 'driveNodeId'>,
    projectFile: Pick<Attachment, 'filename' | 'driveNodeId'>
): boolean {
    if (attachment.driveNodeId && projectFile.driveNodeId) {
        return attachment.driveNodeId === projectFile.driveNodeId;
    }
    return attachment.filename.toLowerCase() === projectFile.filename.toLowerCase();
}

/** Whether the attachment still exists in the project's knowledge base. */
export function isFileInProjectKnowledge(
    attachment: Pick<Attachment, 'filename' | 'driveNodeId'>,
    spaceAttachments: Record<string, Attachment>
): boolean {
    return Object.values(spaceAttachments).some(
        (projectFile) =>
            !projectFile.error && !projectFile.autoRetrieved && attachmentMatchesProjectFile(attachment, projectFile)
    );
}

/** Attachments sourced from project knowledge, RAG, or @mentions of project files. */
export function isProjectKnowledgeAttachment(attachment: Attachment): boolean {
    return Boolean(attachment.autoRetrieved || attachment.conversationContext || attachment.spaceId);
}

/**
 * True when a project-linked attachment has no previewable content because the
 * underlying file was removed from project knowledge.
 */
export function isAttachmentRemovedFromProjectKnowledge(
    attachment: Attachment,
    spaceAttachments: Record<string, Attachment>,
    spaceId?: SpaceId
): boolean {
    if (!spaceId || !isProjectKnowledgeAttachment(attachment)) {
        return false;
    }
    if (attachment.markdown?.trim() || attachment.processing || attachment.error) {
        return false;
    }
    if (attachment.mimeType?.startsWith('image/')) {
        return false;
    }
    return !isFileInProjectKnowledge(attachment, spaceAttachments);
}

/**
 * Format attachment content with standard markers for LLM context
 */
export function formatAttachmentContext(attachment: Attachment): string {
    if (!attachment.markdown) {
        return '';
    }

    const filename = `Filename: ${attachment.filename}`;
    const header = 'File contents:';
    const beginMarker = '----- BEGIN FILE CONTENTS -----';
    const endMarker = '----- END FILE CONTENTS -----';
    const content = attachment.markdown.trim();

    return [filename, header, beginMarker, content, endMarker].join('\n');
}

/**
 * Calculate token count for an attachment's markdown content
 * Returns 0 if no markdown content or calculation fails
 */
export function calculateAttachmentTokenCount(attachment: Attachment): number {
    if (!attachment.markdown) {
        return 0;
    }

    try {
        const fullContext = formatAttachmentContext(attachment);
        const tokenCount = getApproximateTokenCount(fullContext);
        console.log(`Token count calculated for ${attachment.filename}: ${tokenCount} tokens`);
        return tokenCount;
    } catch (error) {
        console.warn('Failed to calculate token count:', error);
        return 0;
    }
}

/**
 * Store attachment in Redux with proper data field handling
 * Both data and imagePreview are stored in the cache to avoid serialization issues
 * The attachment is cleaned before being dispatched to Redux
 */
export function storeAttachmentInRedux(dispatch: LumoDispatch, attachment: Attachment, isImage: boolean): void {
    // Store binary data in cache before dispatching to Redux
    if (attachment.data) {
        attachmentDataCache.setData(attachment.id, attachment.data);
    }
    if (attachment.imagePreview) {
        attachmentDataCache.setImagePreview(attachment.id, attachment.imagePreview);
    }

    // Remove data and imagePreview fields to avoid Redux serialization issues
    const { data, imagePreview, ...attachmentForRedux } = attachment;
    dispatch(upsertAttachment(attachmentForRedux));
}
