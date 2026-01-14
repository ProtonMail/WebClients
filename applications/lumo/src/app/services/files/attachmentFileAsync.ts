import { getApproximateTokenCount } from '../../llm/tokenizer';
import { selectAttachments } from '../../redux/selectors';
import { newAttachmentId, pushAttachmentRequest, upsertAttachment } from '../../redux/slices/core/attachments';
import type { LumoDispatch, LumoState } from '../../redux/store';
import type { Attachment, SpaceId } from '../../types';
import type { DriveDocument } from '../../types/documents';
import { sendFileUploadFinishEvent } from '../../util/telemetry';
import type { FileProcessingService } from '../fileProcessingService';
import { SearchService } from '../search/searchService';
import { storePendingAttachment } from './pendingAttachments';

export const handleSpaceAttachmentFileAsync =
    (file: File, spaceId: SpaceId, fileProcessingService: FileProcessingService) =>
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
    }> => {
        const startTime = performance.now();

        // Check for duplicate files in this space
        const currentState = getState();
        const allAttachments = selectAttachments(currentState);

        const spaceAttachments = Object.values(allAttachments).filter((attachment) => attachment.spaceId === spaceId);
        const isDuplicate = spaceAttachments.some(
            (attachment) => attachment.filename === file.name && attachment.rawBytes === file.size
        );

        if (isDuplicate) {
            console.log(`Duplicate file detected in space: ${file.name} (${file.size} bytes)`);
            return {
                success: false,
                isDuplicate: true,
                fileName: file.name,
            };
        }

        const fileData = new Uint8Array(await file.arrayBuffer());

        const attachment: Attachment = {
            id: newAttachmentId(),
            spaceId,
            mimeType: file.type,
            uploadedAt: new Date().toISOString(),
            rawBytes: file.size,
            processing: true,
            filename: file.name,
            // Note: data is included for processing, but will be removed before Redux storage
            data: fileData,
        };

        console.log('Creating space attachment:', { id: attachment.id, spaceId });

        let processedAttachment: Attachment = { ...attachment };
        let hasError = false;
        let isUnsupported = false;

        try {
            const result = await fileProcessingService.processFile(file);

            if (result.type === 'text') {
                processedAttachment = {
                    ...processedAttachment,
                    markdown: result.content,
                    truncated: result.metadata?.truncated,
                    originalRowCount: result.metadata?.rowCount?.original,
                    processedRowCount: result.metadata?.rowCount?.processed,
                };

                if (processedAttachment.markdown) {
                    try {
                        const filename = `Filename: ${processedAttachment.filename}`;
                        const tokenCount = getApproximateTokenCount(`${filename}\n${processedAttachment.markdown}`);
                        processedAttachment.tokenCount = tokenCount;
                    } catch (tokenError) {
                        console.warn('Failed to calculate token count:', tokenError);
                    }
                }
            } else if (result.type === 'error') {
                hasError = true;
                isUnsupported = result.unsupported || false;
                processedAttachment.error = true;
                processedAttachment.errorMessage = result.message;
            }
        } catch (error) {
            console.error('Error processing file:', error);
            hasError = true;
            processedAttachment.error = true;
            processedAttachment.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        }

        processedAttachment.processing = false;

        // Store the full attachment (with data) in a temporary Map, not in Redux
        // This avoids non-serializable Uint8Array in Redux actions/state
        storePendingAttachment(processedAttachment);

        // Remove binary data before storing in Redux (but keep markdown for LLM context)
        // Use destructuring instead of delete to ensure clean object
        const { data, ...attachmentForRedux } = processedAttachment;

        // Add attachment to Redux store (without binary data, but with markdown for LLM)
        dispatch(upsertAttachment(attachmentForRedux));

        // Trigger persistence to backend (saga will fetch full attachment from pendingAttachmentsMap)
        if (!hasError) {
            dispatch(pushAttachmentRequest({ id: processedAttachment.id }));
        }

        // Index the file into the search service for RAG retrieval
        // This uses the same chunking as Drive files for large documents
        if (!hasError && processedAttachment.markdown) {
            try {
                const userId = currentState.user?.value?.ID;
                if (userId) {
                    const searchService = SearchService.get(userId);
                    const document: DriveDocument = {
                        id: processedAttachment.id, // Use attachment ID as document ID
                        name: processedAttachment.filename,
                        content: processedAttachment.markdown,
                        mimeType: processedAttachment.mimeType || 'application/octet-stream',
                        size: processedAttachment.rawBytes || 0,
                        modifiedTime: Date.now(),
                        folderId: spaceId, // Use spaceId as the folder
                        folderPath: 'Uploaded Files', // Virtual folder path
                        spaceId,
                    };

                    // indexDocuments will automatically chunk large files
                    const indexResult = await searchService.indexDocuments([document]);
                    if (indexResult.success) {
                        console.log(`[AttachmentFileAsync] Successfully indexed file: ${processedAttachment.filename}`);
                    } else {
                        console.warn(
                            `[AttachmentFileAsync] Failed to index file: ${processedAttachment.filename}`,
                            indexResult.error
                        );
                    }
                }
            } catch (indexError) {
                console.warn('[AttachmentFileAsync] Failed to index file for search:', indexError);
                // Don't fail the upload if indexing fails
            }
        }

        const endTime = performance.now();
        const processingTimeMs = endTime - startTime;

        // Send telemetry event (optional parameters)
        try {
            sendFileUploadFinishEvent(file.size, file.type, !hasError, isUnsupported, hasError, processingTimeMs);
        } catch (telemetryError) {
            console.warn('Failed to send telemetry event:', telemetryError);
        }

        return {
            success: !hasError,
            isUnsupported,
            fileName: file.name,
            errorMessage: processedAttachment.errorMessage,
            attachmentId: processedAttachment.id,
        };
    };
