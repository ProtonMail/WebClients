/** Downloads, processes, and dispatches a Drive file attachment to Redux. */
import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';

import { useFileProcessing } from '../../../hooks';
import { getApproximateTokenCount } from '../../../llm/tokenizer';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useLumoDispatch } from '../../../redux/hooks';
import { upsertAttachment } from '../../../redux/slices/core/attachments';
import { SearchService } from '../../../services/search/searchService';
import type { Attachment } from '../../../types';
import { storeAttachmentInRedux } from '../../../util/attachmentHelpers';
import { getMimeTypeFromExtension, getProcessingCategory } from '../../../util/filetypes';
import type { DriveSDKFunctions, FileItem } from './useFileMentionAutocomplete';

export function useDriveFileAttachment(
    driveSDK: DriveSDKFunctions | undefined,
    userId: string | undefined
): {
    attach: (file: FileItem, provisionalId: string) => Promise<void>;
} {
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const fileProcessingService = useFileProcessing();
    const isGuest = useIsGuest();

    const attach = useCallback(
        async (file: FileItem, provisionalId: string): Promise<void> => {
            if (!driveSDK) return;

            const mimeType = file.mimeType ?? getMimeTypeFromExtension(file.name);

            const provisionalBase: Attachment = {
                id: provisionalId,
                filename: file.name,
                mimeType,
                uploadedAt: new Date().toISOString(),
                rawBytes: 0,
                processing: true,
            };

            try {
                const isImage = getProcessingCategory(mimeType, file.name) === 'image';

                if (isImage) {
                    // Images are passed as raw bytes directly to the LLM — no text extraction needed.
                    // Bypassing the processing pipeline avoids unnecessary thumbnail generation.
                    console.log('[FileMention] Downloading image from Drive (raw):', file.name);
                    const fileData = await driveSDK.downloadFile(file.id);
                    const data = new Uint8Array(fileData);
                    storeAttachmentInRedux(
                        dispatch,
                        { ...provisionalBase, rawBytes: data.byteLength, data, processing: false },
                        true
                    );
                    return;
                }

                // Non-image files: check search index cache before downloading
                let content: string | null = null;
                let fileSize = 0;

                if (userId && !isGuest) {
                    const searchService = SearchService.get(userId);
                    const indexedDoc = searchService.getDocumentById(file.id);
                    if (indexedDoc && indexedDoc.content) {
                        console.log('[FileMention] Using cached content from search index for:', file.name);
                        content = indexedDoc.content;
                        fileSize = indexedDoc.size;
                    }
                }

                if (!content) {
                    console.log('[FileMention] Downloading file from Drive:', file.name);
                    const fileData = await driveSDK.downloadFile(file.id);
                    const data = new Uint8Array(fileData);
                    fileSize = data.byteLength;

                    const fileBlob = new Blob([data], { type: mimeType });
                    const driveFile = new File([fileBlob], file.name, {
                        type: mimeType,
                        lastModified: Date.now(),
                    });

                    const result = await fileProcessingService.processFile(driveFile);

                    if (result.type === 'text') {
                        content = result.content;
                    } else if (result.type === 'error') {
                        if (result.unsupported) {
                            dispatch(
                                upsertAttachment({
                                    ...provisionalBase,
                                    error: true,
                                    errorMessage: 'File format not supported',
                                    processing: false,
                                })
                            );
                            createNotification({
                                text: c('collider_2025:Error').t`File format not supported: ${file.name}`,
                                type: 'error',
                            });
                        } else {
                            dispatch(
                                upsertAttachment({
                                    ...provisionalBase,
                                    error: true,
                                    errorMessage: result.message,
                                    processing: false,
                                })
                            );
                            createNotification({
                                text: c('collider_2025:Error').t`Failed to process file: ${file.name}`,
                                type: 'error',
                            });
                        }
                        return;
                    }
                }

                if (content) {
                    const filename = `Filename: ${file.name}`;
                    const header = 'File contents:';
                    const beginMarker = '----- BEGIN FILE CONTENTS -----';
                    const endMarker = '----- END FILE CONTENTS -----';
                    const fullContext = [filename, header, beginMarker, content.trim(), endMarker].join('\n');
                    const tokenCount = getApproximateTokenCount(fullContext);

                    dispatch(
                        upsertAttachment({
                            ...provisionalBase,
                            rawBytes: fileSize,
                            markdown: content,
                            truncated: false,
                            tokenCount,
                            processing: false,
                        })
                    );
                }
            } catch (error) {
                console.error('Failed to download/process Drive file:', error);

                const isIntegrityError =
                    error instanceof Error &&
                    (error.message.includes('Data integrity check failed') ||
                        error.message.includes('IntegrityError') ||
                        error.name === 'IntegrityError');

                const errorMessage = isIntegrityError
                    ? c('collider_2025:Error').t`File download failed due to integrity check. Please try again.`
                    : error instanceof Error
                      ? error.message
                      : 'Failed to process file';

                if (isIntegrityError) {
                    createNotification({
                        text: c('collider_2025:Error')
                            .t`Failed to download "${file.name}": Data integrity check failed. Please try again.`,
                        type: 'error',
                    });
                }

                dispatch(
                    upsertAttachment({
                        ...provisionalBase,
                        error: true,
                        errorMessage,
                        processing: false,
                    })
                );
            }
        },
        [driveSDK, userId, isGuest, dispatch, createNotification, fileProcessingService]
    );

    return { attach };
}
