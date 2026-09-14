import { useMemo } from 'react';

import type { ContextFilter } from '../llm';
import { getSummarizedMessageIds } from '../llm/compaction';
import { useLumoMemoSelector, useLumoSelector } from '../redux/hooks';
import { selectAttachments, selectAttachmentsBySpaceId, selectContextFilters, selectMessagesByConversationId } from '../redux/selectors';
import type { Attachment, Message, SpaceId } from '../types';
import { measureExecution } from '../util/performance';

export const useConversationFiles = (
    messageChain: Message[],
    currentAttachments: Attachment[] = [],
    spaceId?: SpaceId
) => {
    const allAttachments = useLumoSelector(selectAttachments);
    const contextFilters = useLumoSelector(selectContextFilters);
    const conversationId = messageChain[0]?.conversationId;
    const messageMap = useLumoMemoSelector(selectMessagesByConversationId, [conversationId]);
    const summarizedMessageIds = useMemo(
        () => getSummarizedMessageIds(messageChain, messageMap),
        [messageChain, messageMap]
    );
    
    // Get space-level attachments (project files)
    // Exclude auto-retrieved attachments as they're conversation-specific
    const spaceAttachments = useLumoSelector(selectAttachmentsBySpaceId(spaceId));
    const spaceAttachmentsList = useMemo(() => 
        Object.values(spaceAttachments).filter(att => !att.autoRetrieved), 
        [spaceAttachments]
    );

    // Get all files currently available in the conversation
    const allConversationFiles = useMemo(() => {
        const files: Attachment[] = [];

        // Add space-level attachments first (project files)
        spaceAttachmentsList.forEach((attachment) => {
            if (!files.some((f) => f.id === attachment.id)) {
                files.push(attachment);
            }
        });

        // Add all attachments from messages (excluding compacted/summarized messages).
        messageChain.forEach((message) => {
            if (summarizedMessageIds.has(message.id)) {
                return;
            }
            if (message.attachments) {
                message.attachments.forEach((shallowAttachment) => {
                    const fullAttachment = allAttachments[shallowAttachment.id];
                    if (fullAttachment && !files.some((f) => f.id === fullAttachment.id)) {
                        files.push(fullAttachment);
                    }
                });
            }
        });

        // Add current provisional attachments
        currentAttachments.forEach((attachment) => {
            if (!files.some((f) => f.id === attachment.id)) {
                files.push(attachment);
            }
        });

        return files;
    }, [spaceAttachmentsList, messageChain, allAttachments, currentAttachments, summarizedMessageIds]);

    // Apply context filters to determine which files would actually be used
    const activeFiles = useMemo(() => {
        return measureExecution('useConversationFiles:activeFiles', () => {
            return allConversationFiles.filter((file) => {
                // Space-level attachments are always included (they have spaceId but no message)
                const isSpaceAttachment = spaceAttachmentsList.some((a) => a.id === file.id);
                if (isSpaceAttachment) return true;

                // Check if this file is excluded by any context filter
                // We need to find which message this file belongs to
                let messageId = '';
                for (const message of messageChain) {
                    if (message.attachments?.some((att) => att.id === file.id)) {
                        messageId = message.id;
                        break;
                    }
                }

                if (!messageId) return true; // Include provisional attachments

                if (summarizedMessageIds.has(messageId)) {
                    return false;
                }

                const filter = contextFilters.find((f: ContextFilter) => f.messageId === messageId);
                return !filter || !filter.excludedFiles.includes(file.filename);
            });
        });
    }, [allConversationFiles, contextFilters, messageChain, spaceAttachmentsList, summarizedMessageIds]);

    return {
        allConversationFiles,
        activeFiles,
        contextFilters,
    };
};
