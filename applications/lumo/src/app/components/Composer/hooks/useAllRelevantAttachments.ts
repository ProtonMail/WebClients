import { useMemo } from 'react';

import { getSummarizedMessageIds } from '../../../llm/compaction';
import { useLumoMemoSelector, useLumoSelector } from '../../../redux/hooks';
import { selectAttachmentsBySpaceId, selectMessagesByConversationId } from '../../../redux/selectors';
import type { Attachment, Message, SpaceId } from '../../../types';

// Custom hook to get all attachments relevant for context calculations
export const useAllRelevantAttachments = (
    messageChain: Message[],
    provisionalAttachments: Attachment[],
    spaceId?: SpaceId
) => {
    // Get the full attachments state
    const allAttachments = useLumoSelector((state) => state.attachments);
    const conversationId = messageChain[0]?.conversationId;
    const messageMap = useLumoMemoSelector(selectMessagesByConversationId, [conversationId]);

    // Get space-level attachments (project files)
    // Exclude auto-retrieved attachments as they're conversation-specific
    const spaceAttachments = useLumoSelector(selectAttachmentsBySpaceId(spaceId));
    const spaceAttachmentsList = useMemo(
        () => Object.values(spaceAttachments).filter((att) => !att.error && !att.processing && !att.autoRetrieved),
        [spaceAttachments]
    );

    // Get all attachment IDs from the message chain
    const messageAttachmentIds = useMemo(() => {
        if (!messageChain || messageChain.length === 0) {
            return [];
        }

        const summarizedMessageIds = getSummarizedMessageIds(messageChain, messageMap);
        return messageChain.flatMap((message) => {
            if (summarizedMessageIds.has(message.id)) {
                return [];
            }
            return message.attachments?.map((attachment) => attachment.id) || [];
        });
    }, [messageChain, messageMap]);

    // Get full attachment data for all message attachments
    // Filter out role='assistant' attachments (inline images) from context
    const messageAttachments = useMemo(() => {
        if (!messageAttachmentIds || messageAttachmentIds.length === 0) return [];
        return messageAttachmentIds
            .map((id) => allAttachments[id])
            .filter(Boolean)
            .filter((attachment) => attachment.role !== 'assistant') as Attachment[];
    }, [messageAttachmentIds, allAttachments]);

    // Combine all attachments: space assets + space attachments + provisional + message attachments
    // Filter out duplicates (space attachments and provisional attachments take precedence)
    return useMemo(() => {
        const allSources = [...spaceAttachmentsList, ...(provisionalAttachments || []), ...(messageAttachments || [])];

        // Remove duplicates by ID
        const seen = new Set<string>();
        const unique: Attachment[] = [];

        for (const attachment of allSources) {
            if (!seen.has(attachment.id)) {
                seen.add(attachment.id);
                unique.push(attachment);
            }
        }

        return unique;
    }, [spaceAttachmentsList, provisionalAttachments, messageAttachments]);
};
