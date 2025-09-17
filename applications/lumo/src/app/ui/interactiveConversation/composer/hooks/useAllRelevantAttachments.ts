import { useMemo } from 'react';

import { useLumoSelector } from '../../../../redux/hooks';
import type { Attachment, Message } from '../../../../types';

// Custom hook to get all attachments relevant for context calculations
export const useAllRelevantAttachments = (messageChain: Message[], provisionalAttachments: Attachment[]) => {
    // Get the full attachments state
    const allAttachments = useLumoSelector((state) => state.attachments);

    // Get all attachment IDs from the message chain
    const messageAttachmentIds = useMemo(() => {
        if (!messageChain || messageChain.length === 0) return [];
        return messageChain.flatMap((message) => message.attachments?.map((attachment) => attachment.id) || []);
    }, [messageChain]);

    // Get full attachment data for all message attachments
    const messageAttachments = useMemo(() => {
        if (!messageAttachmentIds || messageAttachmentIds.length === 0) return [];
        return messageAttachmentIds.map((id) => allAttachments[id]).filter(Boolean) as Attachment[];
    }, [messageAttachmentIds, allAttachments]);

    // Combine provisional attachments with message attachments
    // Filter out duplicates (provisional attachments take precedence)
    const combinedAttachments = useMemo(() => {
        if (!provisionalAttachments) return messageAttachments;
        if (!messageAttachments || messageAttachments.length === 0) return provisionalAttachments;

        const provisionalIds = new Set(provisionalAttachments.map((a) => a.id));
        const uniqueMessageAttachments = messageAttachments.filter((a) => !provisionalIds.has(a.id));
        return [...provisionalAttachments, ...uniqueMessageAttachments];
    }, [provisionalAttachments, messageAttachments]);

    return combinedAttachments;
};
