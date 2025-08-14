import { useMemo } from 'react';

import type { ContextFilter } from '../llm';
import { useLumoSelector } from '../redux/hooks';
import { selectAttachments, selectContextFilters } from '../redux/selectors';
import type { Attachment, Message } from '../types';
import { measureExecution } from '../util/performance';

export const useConversationFiles = (messageChain: Message[], currentAttachments: Attachment[] = []) => {
    const allAttachments = useLumoSelector(selectAttachments);
    const contextFilters = useLumoSelector(selectContextFilters);

    // Get all files currently available in the conversation
    const allConversationFiles = useMemo(() => {
        const files: Attachment[] = [];

        // Add all attachments from messages
        messageChain.forEach((message) => {
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
    }, [messageChain, allAttachments, currentAttachments]);

    // Apply context filters to determine which files would actually be used
    const activeFiles = useMemo(() => {
        return measureExecution('useConversationFiles:activeFiles', () => {
            return allConversationFiles.filter((file) => {
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

                const filter = contextFilters.find((f: ContextFilter) => f.messageId === messageId);
                return !filter || !filter.excludedFiles.includes(file.filename);
            });
        });
    }, [allConversationFiles, contextFilters, messageChain]);

    return {
        allConversationFiles,
        activeFiles,
        contextFilters,
    };
};
