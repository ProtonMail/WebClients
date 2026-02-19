/**
 * Duplicate file detection utilities
 * Centralizes logic for detecting duplicate file uploads within a conversation
 */

import type { Attachment, AttachmentId, Message } from '../../types';

/**
 * Get all attachments scoped to the current conversation
 * This includes:
 * 1. Attachments from all messages in the conversation
 * 2. Provisional attachments (uploaded but not yet sent)
 */
export function getConversationAttachments(
    messageChain: Message[],
    allAttachments: Record<AttachmentId, Attachment>
): Attachment[] {
    const conversationAttachments: Attachment[] = [];

    // Add all attachments from messages in the current conversation
    messageChain.forEach((message) => {
        if (message.attachments) {
            message.attachments.forEach((shallowAttachment) => {
                const fullAttachment = allAttachments[shallowAttachment.id];
                if (fullAttachment && !conversationAttachments.some((f) => f.id === fullAttachment.id)) {
                    conversationAttachments.push(fullAttachment);
                }
            });
        }
    });

    // Also add current provisional attachments (files uploaded but not yet sent in this session)
    const provisionalAttachments = Object.values(allAttachments).filter((a) => !a.spaceId);
    provisionalAttachments.forEach((attachment) => {
        if (!conversationAttachments.some((f) => f.id === attachment.id)) {
            conversationAttachments.push(attachment);
        }
    });

    return conversationAttachments;
}

/**
 * Find a duplicate attachment in the conversation
 * A file is considered duplicate if it has the same name (case-insensitive)
 * We check by filename only since size might differ slightly or be unknown for Drive files
 * Returns the duplicate attachment if found, null otherwise
 */
export function findDuplicateAttachment(
    file: File,
    messageChain: Message[],
    allAttachments: Record<AttachmentId, Attachment>
): Attachment | null {
    const conversationAttachments = getConversationAttachments(messageChain, allAttachments);

    // Check if a file with the same name already exists in this conversation (case-insensitive)
    const duplicate = conversationAttachments.find(
        (attachment) => attachment.filename.toLowerCase() === file.name.toLowerCase()
    );

    return duplicate || null;
}

/**
 * Check if a file is a duplicate in the conversation
 */
export function isDuplicateFile(
    file: File,
    messageChain: Message[],
    allAttachments: Record<AttachmentId, Attachment>
): boolean {
    return findDuplicateAttachment(file, messageChain, allAttachments) !== null;
}
