import { useCallback, useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { MAX_FILE_SIZE } from '../../../../constants';
import { useLumoDispatch } from '../../../../redux/hooks';
import { deleteAttachment } from '../../../../redux/slices/core/attachments';
import { handleFileAsync } from '../../../../services/files';
import type { AttachmentId, Message } from '../../../../types';
import { sendFileUploadEvent, sendFileUploadFromDriveEvent } from '../../../../util/telemetry';

export interface UseFileHandlingProps {
    messageChain: Message[];
    onShowDriveBrowser?: () => void;
}

export const useFileHandling = ({ messageChain, onShowDriveBrowser }: UseFileHandlingProps) => {
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                }
            } catch (error) {
                console.error('Error processing file:', error);
                createNotification({
                    text: c('collider_2025: Error').t`Error processing file: ${file.name}`,
                    type: 'error',
                });
            }
        },
        [dispatch, createNotification, messageChain]
    );

    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!e.target.files?.length) return;

            const selectedFiles = Array.from(e.target.files);
            selectedFiles.forEach(handleFileProcessing);
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
