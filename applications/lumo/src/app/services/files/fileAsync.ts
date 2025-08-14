import { getApproximateTokenCount } from '../../llm/tokenizer';
import { newAttachmentId, upsertAttachment } from '../../redux/slices/core/attachments';
import { selectAttachments } from '../../redux/selectors';
import type { LumoDispatch, LumoState } from '../../redux/store';
import type { Attachment, Message } from '../../types';
import { sendFileUploadFinishEvent } from '../../util/telemetry';
import { fileProcessingService } from '../fileProcessingService';

export const handleFileAsync = (file: File, messageChain: Message[] = []) => async (dispatch: LumoDispatch, getState: () => LumoState): Promise<{
    success: boolean;
    isUnsupported?: boolean;
    isDuplicate?: boolean;
    fileName: string;
    errorMessage?: string;
}> => {
    // Record start time for performance tracking
    const startTime = performance.now();

    // Check for duplicate files before processing - scope to current conversation only
    const currentState = getState();
    const allAttachments = selectAttachments(currentState);
    
    // Get attachments scoped to the current conversation (same logic as useConversationFiles)
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
    const provisionalAttachments = Object.values(allAttachments).filter(a => !a.spaceId);
    provisionalAttachments.forEach(attachment => {
        if (!conversationAttachments.some(f => f.id === attachment.id)) {
            conversationAttachments.push(attachment);
        }
    });
    
    // Check if a file with the same name and size already exists in this conversation
    const isDuplicate = conversationAttachments.some(attachment => 
        attachment.filename === file.name && 
        attachment.rawBytes === file.size
    );

    if (isDuplicate) {
        console.log(`Duplicate file detected in current conversation: ${file.name} (${file.size} bytes)`);
        return {
            success: false,
            isDuplicate: true,
            fileName: file.name,
        };
    }

    const fileData = new Uint8Array(await file.arrayBuffer());

    const attachment: Attachment = {
        // pub:
        id: newAttachmentId(),
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        rawBytes: file.size, // size of original binary as sent by user
        processing: true,
        // priv:
        filename: file.name,
        data: fileData, // Keep data for processing
    };

    console.log({ id: attachment.id });

    let processedAttachment: Attachment = { ...attachment };
    let hasError = false;
    let isUnsupported = false;

    try {
        // Use the Web Worker service for file processing
        const result = await fileProcessingService.processFile(file);

        if (result.success && result.result) {
            // All good - file processed successfully
            processedAttachment = {
                ...processedAttachment,
                markdown: result.result.convertedContent,
                truncated: result.result.truncated,
                originalRowCount: result.result.originalRowCount,
                processedRowCount: result.result.processedRowCount,
            };

            // Calculate and cache token count for performance
            // Only calculate if we have markdown content
            if (processedAttachment.markdown) {
                try {
                    // Calculate token count directly (not using the cached function to avoid circular dependency)
                    const filename = `Filename: ${processedAttachment.filename}`;
                    const header = 'File contents:';
                    const beginMarker = '----- BEGIN FILE CONTENTS -----';
                    const endMarker = '----- END FILE CONTENTS -----';
                    const content = processedAttachment.markdown.trim();

                    const fullContext = [filename, header, beginMarker, content, endMarker].join('\n');
                    const tokenCount = getApproximateTokenCount(fullContext);

                    processedAttachment.tokenCount = tokenCount;
                    console.log(`Token count calculated for ${file.name}: ${tokenCount} tokens`);
                } catch (error) {
                    console.warn('Failed to calculate token count:', error);
                    // Don't fail the entire process if token calculation fails
                }
            }
        } else if (result.isUnsupported) {
            // Unsupported file type - don't store in Redux, just return info for caller to show notification
            isUnsupported = true;
            
            // Calculate processing duration for telemetry
            const endTime = performance.now();
            const processingDurationMs = Math.round(endTime - startTime);

            // Send comprehensive telemetry with all file processing data
            sendFileUploadFinishEvent(
                file.size,
                file.type,
                true, // processing completed (even though unsupported)
                isUnsupported,
                false, // not an error, just unsupported
                processingDurationMs
            );

            return {
                success: false,
                isUnsupported: true,
                fileName: file.name,
            };
        } else {
            // Error during conversion
            hasError = true;
            console.error('Error during conversion:', result.error);
            processedAttachment = {
                ...processedAttachment,
                error: true,
                errorMessage: result.error || 'Unknown error during file processing',
            };
        }
    } catch (error) {
        // Error during processing
        hasError = true;
        console.error('Error during file processing:', error);
        processedAttachment = {
            ...processedAttachment,
            error: true,
            errorMessage: error instanceof Error ? error.message : 'Unknown error during file processing',
        };
    }

    // Only store in Redux if not unsupported
    processedAttachment = {
        ...processedAttachment,
        processing: false,
    };

    // Store in Redux initially with processing state (only for supported files)
    const { data: initialData, ...attachmentForRedux } = attachment;
    dispatch(upsertAttachment(attachmentForRedux));

    // Remove the data field before storing final state in Redux to avoid serialization issues
    const { data, ...finalAttachmentForRedux } = processedAttachment;
    dispatch(upsertAttachment(finalAttachmentForRedux));

    // Calculate processing duration
    const endTime = performance.now();
    const processingDurationMs = Math.round(endTime - startTime);

    // Send comprehensive telemetry with all file processing data
    sendFileUploadFinishEvent(
        file.size,
        file.type,
        !processedAttachment.processing,
        isUnsupported,
        hasError,
        processingDurationMs
    );

    return {
        success: !hasError && !isUnsupported,
        fileName: file.name,
        errorMessage: hasError ? processedAttachment.errorMessage : undefined,
    };
};
