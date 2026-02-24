import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { MAX_FILE_SIZE } from '../../../constants';
import { useFileProcessing } from '../../../hooks';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectSpaceByIdOptional } from '../../../redux/selectors';
import { deleteAttachment } from '../../../redux/slices/core/attachments';
import { handleFileAsync } from '../../../services/files';
import { SearchService } from '../../../services/search/searchService';
import type { AttachmentId, Message, ProjectSpace } from '../../../types';
import type { DriveDocument } from '../../../types/documents';
import { isLargeSpreadsheetFile, isPresentationFile } from '../../../util/fileTypeHelpers';
import { sendFileUploadFromDriveEvent } from '../../../util/telemetry';

export type FileUploadMode = 'guest' | 'local' | 'linked-drive';

export interface UseFileHandlingProps {
    messageChain: Message[];
    onShowDriveBrowser?: () => void;
    /** Optional spaceId for project context — enables RAG indexing */
    spaceId?: string;
    /** Optional Drive upload function — only provided for authenticated users */
    uploadToDrive?: (folderId: string, file: File, onProgress?: (progress: number) => void) => Promise<string>;
}

export const useFileHandling = ({ messageChain, onShowDriveBrowser, spaceId, uploadToDrive }: UseFileHandlingProps) => {
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const fileProcessingService = useFileProcessing();
    const userId = useLumoSelector((state) => state.user?.value?.ID);

    // Drive-related Redux data lives here — co-located with Drive logic
    const space = useLumoSelector(selectSpaceByIdOptional(spaceId));
    const linkedDriveFolder = (space as ProjectSpace | undefined)?.linkedDriveFolder;

    // Derived from available data — no isGuest context read needed.
    // Absence of uploadToDrive signals a guest session; linkedDriveFolder signals Drive-upload mode.
    //eslint-disable-next-line no-nested-ternary
    const fileUploadMode: FileUploadMode = !uploadToDrive ? 'guest' : linkedDriveFolder ? 'linked-drive' : 'local';

    const validateFile = useCallback(
        (file: File): boolean => {
            if (file.size > MAX_FILE_SIZE) {
                const maxSizeFormatted = humanSize({ bytes: MAX_FILE_SIZE, unit: 'MB', fraction: 0 });
                const fileSizeFormatted = humanSize({ bytes: file.size, unit: 'MB', fraction: 1 });
                createNotification({
                    text: c('collider_2025: Error')
                        .t`File "${file.name}" is too large (${fileSizeFormatted}). Maximum allowed size is ${maxSizeFormatted}.`,
                    type: 'error',
                });
                return false;
            }
            return true;
        },
        [createNotification]
    );

    const indexFileForSearch = useCallback(
        async (doc: DriveDocument): Promise<void> => {
            if (!userId) return;
            try {
                const searchService = SearchService.get(userId);
                await searchService.indexDocuments([doc]);
                console.log(`[useFileHandling] Indexed file for RAG: ${doc.name}`);
            } catch (indexError) {
                console.warn('[useFileHandling] Failed to index file for RAG:', indexError);
                // Don't fail the upload if indexing fails
            }
        },
        [userId]
    );

    const uploadFileToDrive = useCallback(
        async (file: File): Promise<void> => {
            if (!linkedDriveFolder || !spaceId || !uploadToDrive) return;

            try {
                createNotification({
                    text: c('collider_2025: Info').t`Uploading "${file.name}" to ${DRIVE_APP_NAME}...`,
                    type: 'info',
                });

                const nodeId = await uploadToDrive(linkedDriveFolder.folderId, file, (progress) => {
                    console.log(`Upload progress for ${file.name}: ${Math.round(progress)}%`);
                });

                createNotification({
                    text: c('collider_2025: Success').t`File "${file.name}" uploaded to ${DRIVE_APP_NAME}`,
                    type: 'success',
                });
                console.log(`File uploaded to Drive: ${file.name}, nodeId: ${nodeId}`);

                // Process and index immediately after upload — don't wait for Drive events
                try {
                    const processingResult = await fileProcessingService.processFile(file);

                    if (processingResult.type === 'text') {
                        await indexFileForSearch({
                            id: nodeId,
                            name: file.name,
                            content: processingResult.content,
                            mimeType: file.type,
                            size: file.size,
                            modifiedTime: Date.now(),
                            folderId: linkedDriveFolder.folderId,
                            folderPath: linkedDriveFolder.folderPath || 'Drive',
                            spaceId,
                        });
                    } else if (processingResult.type === 'error') {
                        console.warn(
                            `[useFileHandling] File processing failed for ${file.name}: ${processingResult.message}`
                        );
                        createNotification({
                            text: c('collider_2025: Warning')
                                .t`Failed to index file for search: ${processingResult.message}`,
                            type: 'warning',
                        });
                    }
                } catch (indexError) {
                    console.warn('[useFileHandling] Failed to index Drive file for RAG:', indexError);
                }
            } catch (driveError) {
                console.error('Error uploading to Drive:', driveError);
                createNotification({
                    text: c('collider_2025: Error').t`Failed to upload "${file.name}" to ${DRIVE_APP_NAME}`,
                    type: 'error',
                });
            }
        },
        [createNotification, fileProcessingService, indexFileForSearch, linkedDriveFolder, spaceId, uploadToDrive]
    );

    const processFileLocally = useCallback(
        async (file: File): Promise<void> => {
            if (isLargeSpreadsheetFile(file)) {
                console.log(`Processing large spreadsheet file — this may take a moment...`);
            }

            const result = await dispatch(handleFileAsync(file, messageChain, fileProcessingService));

            if (result.isDuplicate) {
                createNotification({
                    text: c('collider_2025: Error').t`File already added: ${result.fileName}`,
                    type: 'warning',
                });
                return;
            }

            if (result.isUnsupported) {
                if (isPresentationFile(file)) {
                    createNotification({
                        text: c('collider_2025: Error')
                            .t`PowerPoint files are not supported. Please convert to PDF and upload the PDF version for better text extraction.`,
                        type: 'warning',
                    });
                } else {
                    createNotification({
                        text: c('collider_2025: Error').t`File format not supported: ${result.fileName}`,
                        type: 'error',
                    });
                }
                return;
            }

            if (!result.success && result.errorMessage) {
                createNotification({
                    text: c('collider_2025: Error').t`Error processing ${result.fileName}: ${result.errorMessage}`,
                    type: 'error',
                });
                return;
            }

            console.log(`File processing completed: ${file.name}`);

            if (spaceId && result.success && result.attachmentId && result.markdown) {
                await indexFileForSearch({
                    id: result.attachmentId,
                    name: file.name,
                    content: result.markdown,
                    mimeType: file.type,
                    size: file.size,
                    modifiedTime: Date.now(),
                    folderId: spaceId,
                    folderPath: 'Uploaded Files',
                    spaceId,
                });
            }
        },
        [createNotification, dispatch, fileProcessingService, indexFileForSearch, messageChain, spaceId]
    );

    const handleFileProcessing = useCallback(
        async (file: File): Promise<void> => {
            try {
                if (!validateFile(file)) return;

                if (fileUploadMode === 'linked-drive') {
                    await uploadFileToDrive(file);
                } else {
                    await processFileLocally(file);
                }
            } catch (error) {
                console.error('Error processing file:', error);
                createNotification({
                    text: c('collider_2025: Error').t`Error processing file: ${file.name}`,
                    type: 'error',
                });
            }
        },
        [createNotification, fileUploadMode, processFileLocally, uploadFileToDrive, validateFile]
    );

    const handleFilesSelected = useCallback(
        (files: File[]) => {
            files.forEach((file) => handleFileProcessing(file));
        },
        [handleFileProcessing]
    );

    const handleBrowseDrive = useCallback(() => {
        onShowDriveBrowser?.();
        sendFileUploadFromDriveEvent();
    }, [onShowDriveBrowser]);

    const handleDeleteAttachment = useCallback(
        (id: AttachmentId) => {
            dispatch(deleteAttachment(id));
        },
        [dispatch]
    );

    return {
        handleFileProcessing,
        handleFilesSelected,
        handleBrowseDrive,
        handleDeleteAttachment,
        fileUploadMode,
    };
};
