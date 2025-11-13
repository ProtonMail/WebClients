import { useMemo } from 'react';

import type { ContextFilter } from '../llm';
import { useLumoSelector } from '../redux/hooks';
import { selectAttachments, selectContextFilters } from '../redux/selectors';
import { type Attachment, type Message, type SpaceId, isAttachment } from '../types';

// An attachment connected to a message.
export type LinkedAttachment = Attachment & {
    messageId: string;
    messageIndex: number;
};

// prettier-ignore
export function isLinkedAttachment(value: any): value is LinkedAttachment {
    return (
        isAttachment(value) &&
        ('messageId' in value && typeof value.messageId === 'string') &&
        ('messageIndex' in value && typeof value.messageIndex === 'number')
    );
}

/**
 * Hook to get filtered files for the knowledge panel.
 *
 * Note: Project files are now indexed and retrieved via RAG (same as Drive files).
 * This hook primarily handles message attachments and context filtering.
 */
export const useFilteredFiles = (
    messageChain: Message[],
    currentAttachments: Attachment[] = [],
    filterMessage?: Message,
    _spaceId?: SpaceId // Kept for API compatibility, but no longer used
) => {
    const allAttachments = useLumoSelector(selectAttachments);
    const contextFilters = useLumoSelector(selectContextFilters);

    // Build a lookup map that includes both Redux attachments AND shallow attachments from messages
    // This is important because auto-retrieved Drive attachments are not pushed to server,
    // so on synced browsers they only exist as shallow attachments in the message chain
    const combinedAttachments = useMemo(() => {
        const combined: Record<string, Attachment> = {};
        // First add shallow attachments from message chain
        messageChain.forEach((msg) => {
            msg.attachments?.forEach((att) => {
                combined[att.id] = att as Attachment;
            });
        });
        // Then overlay with Redux attachments (which have full data if available)
        Object.assign(combined, allAttachments);
        return combined;
    }, [messageChain, allAttachments]);

    // Helper to get full attachment from shallow attachment reference
    const getFullAttachmentFromShallow = (shallowAttachment: any) => {
        const fullAtt = combinedAttachments[shallowAttachment.id];

        // Skip deleted Drive files (unlinked folders)
        // If it's a Drive file (has driveNodeId) and not in the attachment store, it was deleted
        if (!fullAtt && shallowAttachment.driveNodeId) {
            console.log('[useFilteredFiles] Skipping deleted Drive attachment:', shallowAttachment.id, shallowAttachment.filename);
            return null;
        }

        return fullAtt;
    };

    // Get files to display based on filtering (excluding assistant-generated images)
    const allFiles = useMemo(() => {
        if (!filterMessage) {
            // Show all files from messages in the conversation
            const messageFiles: LinkedAttachment[] = messageChain.flatMap(
                (message) =>
                    message.attachments
                        ?.map((shallowAttachment) => {
                            const fullAttachment = getFullAttachmentFromShallow(shallowAttachment);
                            if (!fullAttachment) return null;
                            // Filter out assistant-generated attachments (e.g., inline images)
                            if (fullAttachment.role === 'assistant') return null;
                            return {
                                ...fullAttachment,
                                // Merge autoRetrieved flag from shallow attachment (for project files)
                                // since we skip upserting modified attachments to Redux
                                autoRetrieved: shallowAttachment.autoRetrieved || fullAttachment.autoRetrieved,
                                isUploadedProjectFile:
                                    shallowAttachment.isUploadedProjectFile || fullAttachment.isUploadedProjectFile,
                                messageId: message.id,
                                messageIndex: messageChain.indexOf(message),
                            } satisfies LinkedAttachment;
                        })
                        .filter((f) => f != null && isLinkedAttachment(f)) || []
            );

            // Deduplicate by ID
            const seen = new Set<string>();
            return messageFiles.filter((file) => {
                if (seen.has(file.id)) return false;
                seen.add(file.id);
                return true;
            });
        }

        // For assistant messages with contextFiles, show exactly the files that were used for that response
        if (filterMessage.role === 'assistant' && filterMessage.contextFiles) {
            return filterMessage.contextFiles
                .map((attachmentId) => {
                    // Use combinedAttachments to find attachments even if not in Redux
                    // (auto-retrieved Drive attachments are only in message chain on synced browsers)
                    const fullAttachment = combinedAttachments[attachmentId];
                    if (!fullAttachment) return null;
                    // Filter out assistant-generated attachments
                    if (fullAttachment.role === 'assistant') return null;

                    // Find which message this attachment belongs to for display purposes
                    let messageId = '';
                    let messageIndex = 0;
                    for (const message of messageChain) {
                        if (message.attachments?.some((a) => a.id === attachmentId)) {
                            messageId = message.id;
                            messageIndex = messageChain.indexOf(message);
                            break;
                        }
                    }

                    return {
                        ...fullAttachment,
                        messageId,
                        messageIndex,
                    };
                })
                .filter((file): file is Attachment & { messageId: string; messageIndex: number } => file !== null);
        }

        // For user messages or legacy assistant messages without contextFiles,
        // show files from that message and all previous messages
        const messagesUpToThisPoint = messageChain.slice(0, messageChain.indexOf(filterMessage) + 1);

        const files = messagesUpToThisPoint.flatMap((message) => {
            return (
                message.attachments?.map((shallowAttachment) => {
                    const fullAttachment = getFullAttachmentFromShallow(shallowAttachment);
                    if (!fullAttachment) return null;
                    // Filter out assistant-generated attachments
                    if (fullAttachment.role === 'assistant') return null;
                    return {
                        ...fullAttachment,
                        // Merge autoRetrieved flag from shallow attachment
                        autoRetrieved: shallowAttachment.autoRetrieved || fullAttachment.autoRetrieved,
                        isUploadedProjectFile:
                            shallowAttachment.isUploadedProjectFile || fullAttachment.isUploadedProjectFile,
                        messageId: message.id,
                        messageIndex: messageChain.indexOf(message),
                    };
                }) || []
            );
        });

        return files.filter((f) => f != null && isLinkedAttachment(f));
    }, [messageChain, combinedAttachments, filterMessage]);

    // Check if a file is excluded based on context filters
    const isFileExcluded = (file: any) => {
        if (!file.messageId) return false;
        const filter = contextFilters.find((f: ContextFilter) => f.messageId === file.messageId);
        return filter ? filter.excludedFiles.includes(file.filename) : false;
    };

    // Separate active vs excluded files (excluding auto-retrieved which are shown separately)
    const activeHistoricalFiles = useMemo(() => {
        if (filterMessage) return allFiles;
        return allFiles.filter((file) => !isFileExcluded(file) && !(file as any).autoRetrieved);
    }, [allFiles, filterMessage, contextFilters]);

    const unusedHistoricalFiles = useMemo(() => {
        if (filterMessage) return [];
        return allFiles.filter((file) => isFileExcluded(file) && !(file as any).autoRetrieved);
    }, [allFiles, filterMessage, contextFilters]);

    // Calculate context based on files that will be used for next question
    const nextQuestionFiles = useMemo(() => {
        return filterMessage ? allFiles : [...currentAttachments, ...activeHistoricalFiles];
    }, [filterMessage, allFiles, currentAttachments, activeHistoricalFiles]);

    return {
        allFiles,
        activeHistoricalFiles,
        unusedHistoricalFiles,
        nextQuestionFiles,
        isFileExcluded,
        contextFilters,
    };
};
