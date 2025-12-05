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
    attachmentId?: string;
    markdown?: string;
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
    
    // Check if a file with the same name already exists in this conversation (case-insensitive)
    // We check by filename only since size might differ slightly or be unknown for Drive files
    const isDuplicate = conversationAttachments.some(attachment => 
        attachment.filename.toLowerCase() === file.name.toLowerCase()
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

    // Check if this is an image - images don't need worker processing
    const isImage = file.type.startsWith('image/');

    if (isImage) {
        // Images bypass the worker - no conversion needed, just keep binary data
        console.log(`Processing image file (no conversion needed): ${file.name} (${file.type})`);
        processedAttachment = {
            ...processedAttachment,
            markdown: '', // No markdown for images
        };
    } else {
        // Non-image files go through the worker for conversion
        try {
            const result = await fileProcessingService.processFile(file);

            if (result.type === 'text') {
                // File processed successfully
                processedAttachment = {
                    ...processedAttachment,
                    markdown: result.content,
                    truncated: result.metadata?.truncated,
                    originalRowCount: result.metadata?.rowCount?.original,
                    processedRowCount: result.metadata?.rowCount?.processed,
                };

                // Calculate and cache token count for performance
                if (processedAttachment.markdown) {
                    try {
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
                    }
                }
            } else if (result.type === 'error') {
                if (result.unsupported) {
                    // Unsupported file type
                    isUnsupported = true;

                    const endTime = performance.now();
                    const processingDurationMs = Math.round(endTime - startTime);

                    sendFileUploadFinishEvent(
                        file.size,
                        file.type,
                        true,
                        isUnsupported,
                        false,
                        processingDurationMs
                    );

                    return {
                        success: false,
                        isUnsupported: true,
                        fileName: file.name,
                    };
                } else {
                    // Processing error
                    hasError = true;
                    console.error('Error during conversion:', result.message);
                    processedAttachment = {
                        ...processedAttachment,
                        error: true,
                        errorMessage: result.message,
                    };
                }
            }
        } catch (error) {
            hasError = true;
            console.error('Error during file processing:', error);
            processedAttachment = {
                ...processedAttachment,
                error: true,
                errorMessage: error instanceof Error ? error.message : 'Unknown error during file processing',
            };
        }
    }

    // Only store in Redux if not unsupported
    processedAttachment = {
        ...processedAttachment,
        processing: false,
    };

    // Store in Redux initially with processing state (only for supported files)
    // Note: isImage was already determined earlier to decide whether to use worker
    if (isImage) {
        // For images, keep the data field - it's needed for WireImage conversion
        dispatch(upsertAttachment(attachment));
    } else {
        // For text files, remove data to avoid serialization issues
        const { data: initialData, ...attachmentForRedux } = attachment;
        dispatch(upsertAttachment(attachmentForRedux));
    }

    // Update with final processed state
    if (isImage) {
        // For images, keep the data field
        dispatch(upsertAttachment(processedAttachment));
    } else {
        // For text files, remove data field before storing final state
        const { data, ...finalAttachmentForRedux } = processedAttachment;
        dispatch(upsertAttachment(finalAttachmentForRedux));
    }

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
        attachmentId: processedAttachment.id,
        markdown: processedAttachment.markdown,
    };
};
