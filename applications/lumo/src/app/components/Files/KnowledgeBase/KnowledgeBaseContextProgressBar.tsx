import React from 'react';

import { c } from 'ttag';

import type { ContextFilter } from '../../../llm';
import {
    CONTEXT_LIMITS,
    calculateAttachmentContextSize,
    calculateMessageContentTokens,
    getContextProgressState,
} from '../../../llm/utils';
import { useLumoSelector } from '../../../redux/hooks';
import { selectAttachments } from '../../../redux/selectors';
import type { Attachment, Message } from '../../../types';

interface KnowledgeBaseContextProgressBarProps {
    messageChain: Message[];
    contextFilters: ContextFilter[];
    currentAttachments?: Attachment[];
}

export const KnowledgeBaseContextProgressBar: React.FC<KnowledgeBaseContextProgressBarProps> = ({
    messageChain,
    contextFilters,
    currentAttachments = [],
}) => {
    // Get all attachments from Redux state
    const allAttachments = useLumoSelector(selectAttachments);

    // Get all files currently available in the conversation (from all messages)
    // Note: Project files are now retrieved via RAG, so only count what's in messages
    const allConversationFiles = React.useMemo(() => {
        const files: Attachment[] = [];

        // Add all attachments from messages (includes auto-retrieved files)
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
    const activeFiles = React.useMemo(() => {
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
    }, [allConversationFiles, contextFilters, messageChain]);

    // Calculate what the actual context size would be for the next message
    const { percentage } = React.useMemo(() => {
        // Calculate tokens from message content (excluding their cached context)
        const messageContentTokens = calculateMessageContentTokens(messageChain);

        // Calculate tokens from currently active files (what would actually be sent to LLM)
        const activeFilesTokens = calculateAttachmentContextSize(activeFiles);

        const total = messageContentTokens + activeFilesTokens;
        const pct = Math.min(100, Math.round((activeFilesTokens / CONTEXT_LIMITS.MAX_CONTEXT) * 100));
        const state = getContextProgressState(pct);

        return {
            percentage: pct,
            progressState: state,
            totalTokens: total,
        };
    }, [messageChain, activeFiles]);

    return (
        <div className="mb-4 w-full">
            <div className="w-full bg-weak rounded-full h-2">
                <div
                    className={`h-full rounded-full transition-all bg-progress-dark`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                />
            </div>
            <div className="text-xs color-weak mt-1">
                {c('collider_2025: Info').t`File capacity`} ({percentage}% {c('collider_2025: Info').t`used`})
            </div>
        </div>
    );
};
