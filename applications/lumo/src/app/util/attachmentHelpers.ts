/**
 * Attachment helper utilities
 * Centralizes attachment processing logic like token counting and Redux storage
 */
import { getApproximateTokenCount } from '../llm/tokenizer';
import { upsertAttachment } from '../redux/slices/core/attachments';
import type { LumoDispatch } from '../redux/store';
import { attachmentDataCache } from '../services/attachmentDataCache';
import type { Attachment, AttachmentId, SpaceId } from '../types';

function attachmentMatchesProjectFile(
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
 * Maps each uploaded document that is an exact copy (same filename and content) of a file already
 * stored in the space to that stored file, so re-attaching it doesn't create another asset counting
 * against the space's hard limit. Only files already on the server qualify as targets: local-only
 * copies (RAG, @mentions) would leave the message pointing at an asset that doesn't exist remotely.
 */
export function findReusableSpaceAttachments(
    uploadedAttachments: Attachment[],
    allAttachments: Record<AttachmentId, Attachment>,
    spaceId: SpaceId,
    isOnServer: (id: AttachmentId) => boolean
): Map<AttachmentId, Attachment> {
    const reusable = new Map<AttachmentId, Attachment>();
    const candidates = Object.values(allAttachments).filter(
        (candidate) =>
            candidate.spaceId === spaceId &&
            candidate.markdown &&
            !candidate.autoRetrieved &&
            !candidate.error &&
            !candidate.processing &&
            isOnServer(candidate.id)
    );
    if (candidates.length === 0) {
        return reusable;
    }

    for (const attachment of uploadedAttachments) {
        if (attachment.spaceId || !attachment.markdown || attachment.mimeType?.startsWith('image/')) {
            continue;
        }
        const match = candidates.find(
            (candidate) => candidate.filename === attachment.filename && candidate.markdown === attachment.markdown
        );
        if (match) {
            reusable.set(attachment.id, match);
        }
    }
    return reusable;
}

/**
 * Format attachment content with standard markers for LLM context
 */
function formatAttachmentContext(attachment: Attachment): string {
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
