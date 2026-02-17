import { useCallback, useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { MAX_FILE_SIZE } from '../../../../constants';
import { useIsGuest } from '../../../../providers/IsGuestProvider';
import { useLumoDispatch, useLumoSelector } from '../../../../redux/hooks';
import { deleteAttachment } from '../../../../redux/slices/core/attachments';
import { fileProcessingService } from '../../../../services/fileProcessingService';
import { handleFileAsync } from '../../../../services/files';
import { SearchService } from '../../../../services/search/searchService';
import type { AttachmentId, LinkedDriveFolder, Message } from '../../../../types';
import type { DriveDocument } from '../../../../types/documents';
import { sendFileUploadEvent, sendFileUploadFromDriveEvent } from '../../../../util/telemetry';

export interface UseFileHandlingProps {
    messageChain: Message[];
    onShowDriveBrowser?: () => void;
    /** Optional spaceId for project context - enables RAG indexing */
    spaceId?: string;
    /** Optional linked Drive folder - when present, uploads go to this folder */
    linkedDriveFolder?: LinkedDriveFolder;
    /** Optional Drive upload function - only provided for authenticated users */
    uploadToDrive?: (folderId: string, file: File, onProgress?: (progress: number) => void) => Promise<string>;
}

export const useFileHandling = ({
    messageChain,
    onShowDriveBrowser,
    spaceId,
    linkedDriveFolder,
    uploadToDrive,
}: UseFileHandlingProps) => {
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const userId = useLumoSelector((state) => state.user?.value?.ID);
    const isGuest = useIsGuest();

    const handleFileProcessing = useCallback(
        async (file: File) => {
            try {
                // Check file size limit first
                if (file.size > MAX_FILE_SIZE) {
                    const maxSizeFormatted = humanSize({ bytes: MAX_FILE_SIZE, unit: 'MB', fraction: 0 });
                    const fileSizeFormatted = humanSize({ bytes: file.size, unit: 'MB', fraction: 1 });
                    createNotification({
                        text: c('collider_2025: Error')
                            .t`File "${file.name}" is too large (${fileSizeFormatted}). Maximum allowed size is ${maxSizeFormatted}.`,
                        type: 'error',
                    });
                    return;
                }

                // If a Drive folder is linked, upload directly to Drive (only for authenticated users with Drive access)
                if (linkedDriveFolder && spaceId && userId && uploadToDrive && !isGuest) {
                    try {
                        console.log(`Uploading file to linked Drive folder: ${file.name}`);
                        createNotification({
                            text: c('collider_2025: Info').t`Uploading "${file.name}" to ${DRIVE_APP_NAME}...`,
                            type: 'info',
                        });

                        const nodeId = await uploadToDrive(linkedDriveFolder.folderId, file, (progress) => {
                            console.log(`Upload progress for ${file.name}: ${Math.round(progress * 100)}%`);
                        });

                        createNotification({
                            text: c('collider_2025: Success').t`File "${file.name}" uploaded to ${DRIVE_APP_NAME}`,
                            type: 'success',
                        });
                        console.log(`File uploaded to Drive: ${file.name}, nodeId: ${nodeId}`);

                        // Immediately process and index the file for RAG (don't wait for Drive events)
                        try {
                            console.log(`[useFileHandling] Processing uploaded Drive file for indexing: ${file.name}`);
                            const processingResult = await fileProcessingService.processFile(file);

                            if (processingResult.success && processingResult.result) {
                                const searchService = SearchService.get(userId);
                                const document: DriveDocument = {
                                    id: nodeId,
                                    name: file.name,
                                    content: processingResult.result.convertedContent,
                                    mimeType: file.type,
                                    size: file.size,
                                    modifiedTime: Date.now(),
                                    folderId: linkedDriveFolder.folderId,
                                    folderPath: linkedDriveFolder.folderPath || 'Drive',
                                    spaceId,
                                };
                                await searchService.indexDocuments([document]);
                                console.log(`[useFileHandling] Indexed Drive file for RAG: ${file.name}`);
                            } else {
                                console.warn(`[useFileHandling] File processing failed, not indexing: ${file.name}`);
                            }
                        } catch (indexError) {
                            console.warn('[useFileHandling] Failed to index Drive file for RAG:', indexError);
                            // Don't fail the upload if indexing fails
                        }
                        return;
                    } catch (driveError) {
                        console.error('Error uploading to Drive:', driveError);
                        createNotification({
                            text: c('collider_2025: Error').t`Failed to upload "${file.name}" to ${DRIVE_APP_NAME}`,
                            type: 'error',
                        });
                        return;
                    }
                }

                // No linked Drive folder - process locally
                // Log file processing start for user feedback
                console.log(`Starting file processing: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

                // Special messaging for large CSV files
                if (
                    (file.type === 'text/csv' ||
                        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                        file.type === 'application/vnd.ms-excel') &&
                    file.size > 1024 * 1024
                ) {
                    // > 1MB
                    console.log(`Processing large spreadsheet file - this may take a moment...`);
                }

                const result = await dispatch(handleFileAsync(file, messageChain));

                if (result.isDuplicate) {
                    // Show toast notification for duplicate file
                    createNotification({
                        text: c('collider_2025: Error').t`File already added: ${result.fileName}`,
                        type: 'warning',
                    });
                } else if (result.isUnsupported) {
                    // Special message for PPTX files with conversion suggestions
                    if (
                        file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                        file.type === 'application/vnd.ms-powerpoint' ||
                        file.name.toLowerCase().endsWith('.pptx') ||
                        file.name.toLowerCase().endsWith('.ppt')
                    ) {
                        createNotification({
                            text: c('collider_2025: Error')
                                .t`PowerPoint files are not supported. Please convert to PDF and upload the PDF version for better text extraction.`,
                            type: 'warning',
                        });
                    } else {
                        // Show generic unsupported file notification
                        createNotification({
                            text: c('collider_2025: Error').t`File format not supported: ${result.fileName}`,
                            type: 'error',
                        });
                    }
                } else if (!result.success && result.errorMessage) {
                    // Show toast notification for processing error
                    createNotification({
                        text: c('collider_2025: Error').t`Error processing ${result.fileName}: ${result.errorMessage}`,
                        type: 'error',
                    });
                } else {
                    console.log(`File processing completed: ${file.name}`);

                    // If in project context, also index for RAG search
                    if (spaceId && result.success && result.attachmentId && result.markdown && userId) {
                        try {
                            const searchService = SearchService.get(userId);
                            const document: DriveDocument = {
                                id: result.attachmentId,
                                name: file.name,
                                content: result.markdown,
                                mimeType: file.type,
                                size: file.size,
                                modifiedTime: Date.now(),
                                folderId: spaceId,
                                folderPath: 'Uploaded Files',
                                spaceId,
                            };
                            await searchService.indexDocuments([document]);
                            console.log(`[useFileHandling] Indexed file for RAG: ${file.name}`);
                        } catch (indexError) {
                            console.warn('[useFileHandling] Failed to index file for RAG:', indexError);
                            // Don't fail the upload if indexing fails
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing file:', error);
                createNotification({
                    text: c('collider_2025: Error').t`Error processing file: ${file.name}`,
                    type: 'error',
                });
            }
        },
        [dispatch, createNotification, messageChain, spaceId, userId, linkedDriveFolder, uploadToDrive, isGuest]
    );

    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!e.target.files?.length) return;

            const selectedFiles = Array.from(e.target.files);
            selectedFiles.forEach(handleFileProcessing);

            // Reset the input value so the same file can be selected again
            if (e.target) {
                e.target.value = '';
            }
        },
        [handleFileProcessing]
    );

    const handleOpenFileDialog = useCallback(() => {
        fileInputRef.current?.click();
        sendFileUploadEvent();
    }, []);

    const handleBrowseDrive = useCallback(() => {
        onShowDriveBrowser?.();
        sendFileUploadFromDriveEvent();
    }, [onShowDriveBrowser]);

    const handleDeleteAttachment = useCallback(
        async (id: AttachmentId) => {
            try {
                dispatch(deleteAttachment(id));
            } catch (error) {
                console.error('Error deleting file:', error);
            }
        },
        [dispatch]
    );

    return {
        fileInputRef,
        handleFileProcessing,
        handleFileInputChange,
        handleOpenFileDialog,
        handleBrowseDrive,
        handleDeleteAttachment,
    };
};
