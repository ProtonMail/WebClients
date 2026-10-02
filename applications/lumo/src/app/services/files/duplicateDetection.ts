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
function getConversationAttachments(
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
 * Generate a filename that does not collide with any attachment already in the
 * conversation (case-insensitive). If the desired name is free it is returned
 * as-is; otherwise a counter suffix is appended before the extension, e.g.
 * `image.png` -> `image (2).png` -> `image (3).png`.
 */
export function generateUniqueFilename(
    filename: string,
    messageChain: Message[],
    allAttachments: Record<AttachmentId, Attachment>
): string {
    const conversationAttachments = getConversationAttachments(messageChain, allAttachments);
    const existingNames = new Set(conversationAttachments.map((attachment) => attachment.filename.toLowerCase()));

    if (!existingNames.has(filename.toLowerCase())) {
        return filename;
    }

    // Split into base name and extension. A leading dot (e.g. ".gitignore") is
    // treated as part of the base name rather than an extension.
    const dotIndex = filename.lastIndexOf('.');
    const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
    const ext = dotIndex > 0 ? filename.slice(dotIndex) : '';

    let counter = 2;
    let candidate = `${base} (${counter})${ext}`;
    while (existingNames.has(candidate.toLowerCase())) {
        counter++;
        candidate = `${base} (${counter})${ext}`;
    }

    return candidate;
}
