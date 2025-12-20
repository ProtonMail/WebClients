import { useMemo } from 'react';

import { useLumoSelector } from '../../../../redux/hooks';
import { selectAttachmentsBySpaceId, selectAssetsBySpaceId } from '../../../../redux/selectors';
import type { Attachment, Message, SpaceId } from '../../../../types';

// Custom hook to get all attachments relevant for context calculations
export const useAllRelevantAttachments = (
    messageChain: Message[],
    provisionalAttachments: Attachment[],
    spaceId?: SpaceId
) => {
    // Get the full attachments state
    const allAttachments = useLumoSelector((state) => state.attachments);

    // Get space-level attachments (project files)
    // Exclude auto-retrieved attachments as they're conversation-specific
    const spaceAttachments = useLumoSelector((state) =>
        spaceId ? selectAttachmentsBySpaceId(spaceId)(state) : {}
    );
    const spaceAttachmentsList = useMemo(() => 
        Object.values(spaceAttachments).filter(att => !att.autoRetrieved), 
        [spaceAttachments]
    );

    // Get space-level assets (project files stored as assets)
    // Exclude auto-retrieved files as they're from Drive indexing, not user uploads
    const spaceAssets = useLumoSelector((state) =>
        spaceId ? selectAssetsBySpaceId(spaceId)(state) : {}
    );
    const spaceAssetsList = useMemo(() => 
        Object.values(spaceAssets).filter((asset) => !asset.error && !asset.processing && !asset.autoRetrieved)
    , [spaceAssets]);

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

    // Combine all attachments: space assets + space attachments + provisional + message attachments
    // Filter out duplicates (space attachments and provisional attachments take precedence)
    const combinedAttachments = useMemo(() => {
        const allSources = [
            ...spaceAssetsList,
            ...spaceAttachmentsList,
            ...(provisionalAttachments || []),
            ...(messageAttachments || []),
        ];

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
    }, [spaceAssetsList, spaceAttachmentsList, provisionalAttachments, messageAttachments]);

    return combinedAttachments;
};
