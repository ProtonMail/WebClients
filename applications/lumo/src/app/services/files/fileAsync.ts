import { selectAttachments } from '../../redux/selectors';
import { newAttachmentId } from '../../redux/slices/core/attachments';
import type { LumoDispatch, LumoState } from '../../redux/store';
import type { Attachment, Message } from '../../types';
import { calculateAttachmentTokenCount, storeAttachmentInRedux } from '../../util/attachmentHelpers';
import { isImageFile } from '../../util/fileTypeHelpers';
import { sendFileUploadFinishEvent } from '../../util/telemetry';
import type { FileProcessingService } from '../fileProcessingService';
import { findDuplicateAttachment } from './duplicateDetection';

export const handleFileAsync =
    (file: File, messageChain: Message[] = [], fileProcessingService: FileProcessingService) =>
    async (
        dispatch: LumoDispatch,
        getState: () => LumoState
    ): Promise<{
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
        const duplicate = findDuplicateAttachment(file, messageChain, allAttachments);
        if (duplicate) {
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

        // Determine if this is an image
        const isImage = isImageFile(file);

        // Dispatch initial attachment state immediately so it shows in UI with processing state
        storeAttachmentInRedux(dispatch, attachment, isImage);

        let processedAttachment: Attachment = { ...attachment };
        let hasError = false;
        let isUnsupported = false;

        // All files go through the worker for processing
        try {
            const result = await fileProcessingService.processFile(file);

            if (result.type === 'text') {
                // Text file processed successfully
                processedAttachment = {
                    ...processedAttachment,
                    markdown: result.content,
                    truncated: result.metadata?.truncated,
                    originalRowCount: result.metadata?.rowCount?.original,
                    processedRowCount: result.metadata?.rowCount?.processed,
                };

                // Calculate and cache token count for performance
                if (processedAttachment.markdown) {
                    const tokenCount = calculateAttachmentTokenCount(processedAttachment);
                    if (tokenCount > 0) {
                        processedAttachment.tokenCount = tokenCount;
                    }
                }
            } else if (result.type === 'image') {
                // Image processed successfully - update with processed data
                processedAttachment = {
                    ...processedAttachment,
                    markdown: undefined, // No markdown for images
                    // TODO: try to fill `markdown` with Tesseract OCR?
                    data: result.hdImage, // Store processed image data
                    imagePreview: result.previewThumbnail,
                };
                console.log(
                    `Image processed: ${file.name}, original: ${result.originalSize} bytes, processed: ${result.hdImageSize} bytes`
                );
            } else if (result.type === 'error') {
                if (result.unsupported) {
                    // Unsupported file type
                    isUnsupported = true;

                    const endTime = performance.now();
                    const processingDurationMs = Math.round(endTime - startTime);

                    sendFileUploadFinishEvent(file.size, file.type, true, isUnsupported, false, processingDurationMs);

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

        // Only store in Redux if not unsupported
        processedAttachment = {
            ...processedAttachment,
            processing: false,
        };

        // Store final processed state in Redux (initial state was already dispatched earlier)
        storeAttachmentInRedux(dispatch, processedAttachment, isImage);

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
