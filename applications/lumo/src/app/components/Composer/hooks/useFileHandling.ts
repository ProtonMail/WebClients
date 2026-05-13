import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { MAX_ASSET_SIZE } from '../../../constants';
import { useFileProcessing } from '../../../hooks';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectSpaceByIdOptional } from '../../../redux/selectors';
import { deleteAttachment } from '../../../redux/slices/core/attachments';
import { handleFileAsync } from '../../../services/files';
import { type ExcelSheetInfo, createExcelSheetFile, getExcelSheetsFromFile } from '../../../services/files/excelSheets';
import { SearchService } from '../../../services/search/searchService';
import type { AttachmentId, Message, ProjectSpace } from '../../../types';
import type { DriveDocument } from '../../../types/documents';
import { isExcelFile, isLargeSpreadsheetFile, isPresentationFile, isSupportedFile } from '../../../util/fileTypeHelpers';
import { sendFileUploadFromDriveEvent } from '../../../util/telemetry';

export type FileUploadMode = 'guest' | 'local' | 'linked-drive';

export interface UseFileHandlingProps {
    messageChain: Message[];
    onShowDriveBrowser?: () => void;
    /** Optional spaceId for project context — enables RAG indexing */
    spaceId?: string;
    /** Optional Drive upload function — only provided for authenticated users */
    uploadToDrive?: (folderId: string, file: File, onProgress?: (progress: number) => void) => Promise<string>;
    onSelectExcelSheets?: (file: File, sheets: ExcelSheetInfo[]) => Promise<string[] | null>;
    /**
     * Emit a success notification once the file has been added. Defaults to
     * false because the composer surfaces success implicitly via the attachment
     * appearing in the message bar; enable it for flows where the user needs
     * explicit feedback (e.g. files added from the knowledge base panel).
     */
    notifyOnSuccess?: boolean;
}

export const useFileHandling = ({
    messageChain,
    onShowDriveBrowser,
    spaceId,
    uploadToDrive,
    onSelectExcelSheets,
    notifyOnSuccess = false,
}: UseFileHandlingProps) => {
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
            // Reject unsupported file types up-front so we never dispatch a stuck
            // "processing" attachment into Redux for something we can't import.
            if (!isSupportedFile(file)) {
                if (isPresentationFile(file)) {
                    createNotification({
                        text: c('collider_2025: Error')
                            .t`PowerPoint files are not supported. Please convert to PDF and upload the PDF version for better text extraction.`,
                        type: 'warning',
                    });
                } else {
                    createNotification({
                        text: c('collider_2025: Error (validation)').t`File format not supported: ${file.name}`,
                        type: 'error',
                    });
                }
                return false;
            }

            // All upload paths (including linked-drive) download, process and index the
            // file, so the same asset-size limit applies everywhere to avoid UI freezes.
            if (file.size > MAX_ASSET_SIZE) {
                const maxSizeFormatted = humanSize({ bytes: MAX_ASSET_SIZE, unit: 'MB', fraction: 0 });
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

    const getSelectedExcelSheetNames = useCallback(
        async (file: File): Promise<string[] | undefined | null> => {
            if (!onSelectExcelSheets || !isExcelFile(file)) {
                return undefined;
            }

            const sheets = await getExcelSheetsFromFile(file);
            if (sheets.length <= 1) {
                return undefined;
            }

            return onSelectExcelSheets(file, sheets);
        },
        [onSelectExcelSheets]
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
        async (file: File, selectedExcelSheetNames?: string[]): Promise<void> => {
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
                    const hasSelectedExcelSheets = selectedExcelSheetNames && selectedExcelSheetNames.length > 0;
                    const filesToIndex = hasSelectedExcelSheets
                        ? selectedExcelSheetNames.map((sheetName) => ({
                              file: createExcelSheetFile(file, sheetName),
                              selectedExcelSheetNames: [sheetName],
                              documentId: `${nodeId}:${sheetName}`,
                          }))
                        : [{ file, selectedExcelSheetNames: undefined, documentId: nodeId }];

                    for (const fileToIndex of filesToIndex) {
                        const processingResult = await fileProcessingService.processFile(fileToIndex.file, {
                            selectedExcelSheetNames: fileToIndex.selectedExcelSheetNames,
                        });

                        if (processingResult.type === 'text') {
                            await indexFileForSearch({
                                id: fileToIndex.documentId,
                                name: fileToIndex.file.name,
                                content: processingResult.content,
                                mimeType: fileToIndex.file.type,
                                size: fileToIndex.file.size,
                                modifiedTime: Date.now(),
                                folderId: linkedDriveFolder.folderId,
                                folderPath: linkedDriveFolder.folderPath || 'Drive',
                                spaceId,
                            });
                        } else if (processingResult.type === 'error') {
                            console.warn(
                                `[useFileHandling] File processing failed for ${fileToIndex.file.name}: ${processingResult.message}`
                            );
                            createNotification({
                                text: c('collider_2025: Warning')
                                    .t`Failed to index file for search: ${processingResult.message}`,
                                type: 'warning',
                            });
                        }
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
        async (file: File, selectedExcelSheetNames?: string[]): Promise<void> => {
            if (isLargeSpreadsheetFile(file)) {
                console.log(`Processing large spreadsheet file — this may take a moment...`);
            }

            const hasSelectedExcelSheets = selectedExcelSheetNames && selectedExcelSheetNames.length > 0;
            const filesToProcess = hasSelectedExcelSheets
                ? selectedExcelSheetNames.map((sheetName) => ({
                      file: createExcelSheetFile(file, sheetName),
                      selectedExcelSheetNames: [sheetName],
                  }))
                : [{ file, selectedExcelSheetNames: undefined }];

            for (const fileToProcess of filesToProcess) {
                const result = await dispatch(
                    handleFileAsync(fileToProcess.file, messageChain, fileProcessingService, {
                        selectedExcelSheetNames: fileToProcess.selectedExcelSheetNames,
                    })
                );

                if (result.isDuplicate) {
                    createNotification({
                        text: c('collider_2025: Error').t`File already added: ${result.fileName}`,
                        type: 'warning',
                    });
                    continue;
                }

                if (result.isUnsupported) {
                    if (isPresentationFile(fileToProcess.file)) {
                        createNotification({
                            text: c('collider_2025: Error')
                                .t`PowerPoint files are not supported. Please convert to PDF and upload the PDF version for better text extraction.`,
                            type: 'warning',
                        });
                    } else {
                        createNotification({
                            text: c('collider_2025: Error (processing)').t`File format not supported: ${result.fileName}`,
                            type: 'error',
                        });
                    }
                    continue;
                }

                if (!result.success && result.errorMessage) {
                    createNotification({
                        text: c('collider_2025: Error').t`Error processing ${result.fileName}: ${result.errorMessage}`,
                        type: 'error',
                    });
                    continue;
                }

                console.log(`File processing completed: ${fileToProcess.file.name}`);

                if (notifyOnSuccess && result.success) {
                    createNotification({
                        text: c('collider_2025: Success').t`File added to knowledge base: ${result.fileName}`,
                        type: 'success',
                    });
                }

                if (spaceId && result.success && result.attachmentId && result.markdown) {
                    await indexFileForSearch({
                        id: result.attachmentId,
                        name: fileToProcess.file.name,
                        content: result.markdown,
                        mimeType: fileToProcess.file.type,
                        size: fileToProcess.file.size,
                        modifiedTime: Date.now(),
                        folderId: spaceId,
                        folderPath: 'Uploaded Files',
                        spaceId,
                    });
                }
            }
        },
        [createNotification, dispatch, fileProcessingService, indexFileForSearch, messageChain, notifyOnSuccess, spaceId]
    );

    const handleLocalFileProcessing = useCallback(
        async (file: File): Promise<void> => {
            try {
                if (!validateFile(file)) return;

                const selectedExcelSheetNames = await getSelectedExcelSheetNames(file);
                if (selectedExcelSheetNames === null) {
                    return;
                }

                await processFileLocally(file, selectedExcelSheetNames);
            } catch (error) {
                console.error('Error processing file locally:', error);
                createNotification({
                    text: c('collider_2025: Error (local processing)').t`Error processing file: ${file.name}`,
                    type: 'error',
                });
            }
        },
        [createNotification, getSelectedExcelSheetNames, processFileLocally, validateFile]
    );

    const handleFileProcessing = useCallback(
        async (file: File): Promise<void> => {
            try {
                if (!validateFile(file)) return;

                const selectedExcelSheetNames = await getSelectedExcelSheetNames(file);
                if (selectedExcelSheetNames === null) {
                    return;
                }

                if (fileUploadMode === 'linked-drive') {
                    await uploadFileToDrive(file, selectedExcelSheetNames);
                } else {
                    await processFileLocally(file, selectedExcelSheetNames);
                }
            } catch (error) {
                console.error('Error processing file:', error);
                createNotification({
                    text: c('collider_2025: Error (file processing)').t`Error processing file: ${file.name}`,
                    type: 'error',
                });
            }
        },
        [
            createNotification,
            fileUploadMode,
            getSelectedExcelSheetNames,
            processFileLocally,
            uploadFileToDrive,
            validateFile,
        ]
    );

    const handleFilesSelected = useCallback(
        (files: File[]) => {
            void (async () => {
                for (const file of files) {
                    await handleFileProcessing(file);
                }
            })();
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

    const handleFilesFromNative = useCallback(
        (files: { base64: string; name: string }[]) => {
            const uploadedFiles = files.map(({ base64, name }) => {
                // Convert base64 to File object
                const base64Data = base64.split(',')[1] || base64; // Remove data URL prefix if present
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);

                // Infer MIME type from file extension
                const extension = name.split('.').pop()?.toLowerCase() || '';
                const mimeType = getMimeType(extension);

                return new File([byteArray], name, { type: mimeType });
            });

            void (async () => {
                for (const file of uploadedFiles) {
                    await handleFileProcessing(file);
                }
            })();
        },
        [handleFileProcessing]
    );

    // Helper function to get MIME type from file extension
    const getMimeType = (extension: string): string => {
        const mimeTypes: { [key: string]: string } = {
            // Images
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',

            // Documents
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ppt: 'application/vnd.ms-powerpoint',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

            // Text
            txt: 'text/plain',
            csv: 'text/csv',
            json: 'application/json',
            xml: 'application/xml',
            html: 'text/html',

            // Archives
            zip: 'application/zip',
            rar: 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed',

            // Audio
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            ogg: 'audio/ogg',

            // Video
            mp4: 'video/mp4',
            avi: 'video/x-msvideo',
            mov: 'video/quicktime',
            webm: 'video/webm',
        };

        return mimeTypes[extension] || 'application/octet-stream';
    };

    return {
        handleFileProcessing,
        handleLocalFileProcessing,
        handleFilesSelected,
        handleBrowseDrive,
        handleDeleteAttachment,
        handleFilesFromNative,
        fileUploadMode,
    };
};
