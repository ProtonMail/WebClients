/** Downloads, processes, and dispatches a Drive file attachment to Redux. */
import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';

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
                driveNodeId: file.id,
                conversationContext: true,
            };

            try {
                const isImage = getProcessingCategory(mimeType, file.name) === 'image';

                if (isImage) {
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

                // Non-image Drive files: resolve text content from the search index.
                if (userId && !isGuest) {
                    const searchService = SearchService.get(userId);
                    await searchService.ensureManifestReady();
                    const doc = searchService.retrieveDocumentForMention(file.name, undefined, file.name, file.id);
                    if (doc?.content) {
                        console.log('[FileMention] Resolved content from search index for:', file.name);
                        dispatch(
                            upsertAttachment({
                                ...provisionalBase,
                                rawBytes: doc.size || new TextEncoder().encode(doc.content).length,
                                markdown: doc.content,
                                tokenCount: getApproximateTokenCount(doc.content),
                                processing: false,
                                ...(doc.isChunk && {
                                    isChunk: doc.isChunk,
                                    chunkTitle: doc.chunkTitle,
                                }),
                            })
                        );
                        return;
                    }
                }

                dispatch(
                    upsertAttachment({
                        ...provisionalBase,
                        processing: true,
                    })
                );
                createNotification({
                    text: c('collider_2025:Info')
                        .t`"${file.name}" is still being indexed. Content will be loaded when you send.`,
                    type: 'info',
                });
            } catch (error) {
                console.error('Failed to resolve Drive file from search index:', error);

                dispatch(
                    upsertAttachment({
                        ...provisionalBase,
                        error: true,
                        errorMessage: error instanceof Error ? error.message : 'Failed to process file',
                        processing: false,
                    })
                );
            }
        },
        [driveSDK, userId, isGuest, dispatch, createNotification]
    );

    return { attach };
}
