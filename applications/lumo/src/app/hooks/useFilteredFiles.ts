import { useMemo } from 'react';

import type { ContextFilter } from '../llm';
import { useLumoSelector } from '../redux/hooks';
import { selectAttachments, selectAttachmentsBySpaceId, selectAssetsBySpaceId, selectContextFilters } from '../redux/selectors';
import type { Attachment, Message, SpaceId } from '../types';

export const useFilteredFiles = (
    messageChain: Message[],
    currentAttachments: Attachment[] = [],
    filterMessage?: Message,
    spaceId?: SpaceId
) => {
    const allAttachments = useLumoSelector(selectAttachments);
    const contextFilters = useLumoSelector(selectContextFilters);
    
    // Get space-level attachments (project files)
    // These are attachments with spaceId that are NOT attached to any message in the conversation
    const spaceAttachments = useLumoSelector((state) =>
        spaceId ? selectAttachmentsBySpaceId(spaceId)(state) : {}
    );
    
    // Get all attachment IDs that are referenced in messages (these are conversation attachments, not project files)
    const messageAttachmentIds = useMemo(() => {
        return new Set(messageChain.flatMap((message) => message.attachments?.map((att) => att.id) || []));
    }, [messageChain]);
    
    const spaceAttachmentsList = useMemo(() => {
        // Filter out:
        // 1. Attachments that are attached to messages in current conversation
        // 2. Auto-retrieved attachments (they're conversation-specific, not true project files)
        return Object.values(spaceAttachments)
            .filter((attachment) => 
                !messageAttachmentIds.has(attachment.id) && 
                !attachment.autoRetrieved
            )
            .map((attachment, index) => ({
                ...attachment,
                messageId: '', // Space attachments don't belong to a specific message
                messageIndex: -1 - index, // Negative index to sort them before message files
            }));
    }, [spaceAttachments, messageAttachmentIds]);

    // Get space-level assets (project files stored as assets)
    const spaceAssets = useLumoSelector((state) =>
        spaceId ? selectAssetsBySpaceId(spaceId)(state) : {}
    );
    const spaceAssetsList = useMemo(() => 
        Object.values(spaceAssets)
            .filter((asset) => !asset.error && !asset.processing)
            .map((asset, index) => ({
                ...asset,
                messageId: '', // Space assets don't belong to a specific message
                messageIndex: -2 - index, // Even more negative to sort assets before attachments
            }))
    , [spaceAssets]);

    // Helper to get full attachment from shallow attachment reference
    const getFullAttachmentFromShallow = (shallowAttachment: any) => {
        return allAttachments[shallowAttachment.id];
    };

    // Get files to display based on filtering
    const allFiles = useMemo(() => {
        if (!filterMessage) {
            const messageFiles = messageChain.flatMap(
                (message) =>
                    message.attachments
                        ?.map((shallowAttachment) => {
                            const fullAttachment = getFullAttachmentFromShallow(shallowAttachment);
                            if (!fullAttachment) return null;
                            return {
                                ...fullAttachment,
                                messageId: message.id,
                                messageIndex: messageChain.indexOf(message),
                            };
                        })
                        .filter(
                            (file): file is Attachment & { messageId: string; messageIndex: number } => file !== null
                        ) || []
            );
            
            // Remove duplicates: if a space asset/attachment is already in a message, don't show it twice
            const spaceFileIds = new Set([...spaceAssetsList.map(a => a.id), ...spaceAttachmentsList.map(a => a.id)]);
            const uniqueMessageFiles = messageFiles.filter(file => !spaceFileIds.has(file.id));
            
            // Include space-level files (assets first, then attachments) at the beginning, then unique message files
            return [...spaceAssetsList, ...spaceAttachmentsList, ...uniqueMessageFiles];
        }

        // For assistant messages with contextFiles, show exactly the files that were used for that response
        if (filterMessage.role === 'assistant' && filterMessage.contextFiles) {
            return filterMessage.contextFiles
                .map((attachmentId) => {
                    const fullAttachment = allAttachments[attachmentId];
                    if (!fullAttachment) return null;

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
                    return {
                        ...fullAttachment,
                        messageId: message.id,
                        messageIndex: messageChain.indexOf(message),
                    };
                }) || []
            );
        });

        const filteredFiles = files.filter((file): file is Attachment & { messageId: string; messageIndex: number } => file !== null);
        
        // Remove duplicates: if a space attachment is already in filteredFiles, don't show it twice
        const spaceAttachmentIds = new Set(spaceAttachmentsList.map(a => a.id));
        const uniqueFilteredFiles = filteredFiles.filter(file => !spaceAttachmentIds.has(file.id));
        
        // Include space-level attachments at the beginning when filtering
        return [...spaceAttachmentsList, ...uniqueFilteredFiles];
    }, [messageChain, allAttachments, filterMessage, spaceAttachmentsList]);

    // Check if a file is excluded based on context filters
    const isFileExcluded = (file: any) => {
        // Space-level attachments (with empty messageId) are never excluded
        if (!file.messageId) return false;
        
        const filter = contextFilters.find((f: ContextFilter) => f.messageId === file.messageId);
        return filter ? filter.excludedFiles.includes(file.filename) : false;
    };

    // When filtering, show all files from the message (no active/unused distinction)
    // When not filtering, separate historical files: by default all are ACTIVE unless filtered out
    const activeHistoricalFiles = useMemo(() => {
        return filterMessage ? allFiles : allFiles.filter((file) => !isFileExcluded(file));
    }, [allFiles, filterMessage, contextFilters]);

    const unusedHistoricalFiles = useMemo(() => {
        return filterMessage ? [] : allFiles.filter((file) => isFileExcluded(file));
    }, [allFiles, filterMessage, contextFilters]);

    // Calculate context based on files that will be used for next question
    const nextQuestionFiles = useMemo(() => {
        return filterMessage ? allFiles : [...currentAttachments, ...activeHistoricalFiles];
    }, [filterMessage, allFiles, currentAttachments, activeHistoricalFiles]);

    // Separate project files (space-level assets and attachments) from message files
    const projectFiles = useMemo(() => {
        // Include both space assets and space attachments as project files
        return [...spaceAssetsList, ...spaceAttachmentsList];
    }, [spaceAssetsList, spaceAttachmentsList]);

    // Filter activeHistoricalFiles to exclude project files and auto-retrieved files (they're shown separately)
    const messageOnlyActiveFiles = useMemo(() => {
        const projectFileIds = new Set(projectFiles.map(f => f.id));
        return activeHistoricalFiles.filter(file => 
            !projectFileIds.has(file.id) && !(file as any).autoRetrieved
        );
    }, [activeHistoricalFiles, projectFiles]);

    return {
        allFiles,
        activeHistoricalFiles: messageOnlyActiveFiles,
        unusedHistoricalFiles,
        nextQuestionFiles,
        isFileExcluded,
        contextFilters,
        projectFiles, // New: separate list of project files
    };
};
