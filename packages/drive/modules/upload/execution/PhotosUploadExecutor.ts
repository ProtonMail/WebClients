import { c } from 'ttag';

import { CryptoProxy } from '@proton/crypto';
import { traceError } from '@proton/shared/lib/helpers/sentry';
import { getItem } from '@proton/shared/lib/helpers/storage';

import { NodeWithSameNameExistsValidationError } from '../../../index';
import { type ExtendedAttributesMetadata, generatePhotosExtendedAttributes } from '../../extendedAttributes';
import { generateThumbnail } from '../../thumbnails';
import { UploadDriveClientRegistry } from '../UploadDriveClientRegistry';
import { useUploadControllerStore } from '../store/uploadController.store';
import type { PhotosUploadTask } from '../types';
import { createFileStream } from '../utils/createFileStream';
import { TaskExecutor } from './TaskExecutor';

/**
 * Executes file uploads and emits events
 * NO store access - only emits events
 */
// TODO: Improve abort check and update thumbnail generator to support abortController
export class PhotosUploadExecutor extends TaskExecutor<PhotosUploadTask> {
    async execute(task: PhotosUploadTask): Promise<void> {
        const controllerStore = useUploadControllerStore.getState();
        const storedController = controllerStore.getController(task.uploadId);

        if (!storedController) {
            return;
        }

        const abortController = storedController.abortController;

        if (abortController.signal.aborted) {
            return;
        }

        try {
            const drivePhotos = UploadDriveClientRegistry.getDrivePhotosClient();
            const duplicateUids = await drivePhotos.findPhotoDuplicates(
                task.file.name,
                async () => {
                    const fileStream = createFileStream(task.file);
                    const hashResult = await CryptoProxy.computeHashStream({
                        algorithm: 'unsafeSHA1',
                        dataStream: fileStream,
                    });
                    return hashResult.toHex();
                },
                abortController.signal
            );
            if (duplicateUids.length > 0) {
                this.eventCallback?.({
                    type: 'photo:exist',
                    uploadId: task.uploadId,
                    duplicateUids,
                });
                return;
            }

            if (abortController.signal.aborted) {
                return;
            }

            const { thumbnails, mediaInfo, mimeType } = await this.generateThumbnails(task.file);

            if (abortController.signal.aborted) {
                return;
            }

            const metadata = await this.createFileUploaderMetadata(
                task.file,
                mimeType,
                mediaInfo,
                task.isUnfinishedUpload
            );

            if (abortController.signal.aborted) {
                return;
            }

            const uploader = await drivePhotos.getFileUploader(task.file.name, metadata, abortController.signal);

            const stream = createFileStream(task.file);
            const controller = await uploader.uploadFromStream(stream, thumbnails, (uploadedBytes: number) => {
                this.eventCallback?.({
                    type: 'file:progress',
                    uploadId: task.uploadId,
                    uploadedBytes,
                    isForPhotos: true,
                });
            });

            this.eventCallback?.({
                type: 'file:started',
                uploadId: task.uploadId,
                controller,
                isForPhotos: true,
            });

            const { nodeUid } = await controller.completion();

            this.eventCallback?.({
                type: 'file:complete',
                uploadId: task.uploadId,
                nodeUid,
                parentUid: undefined,
                isUpdatedNode: false,
                isForPhotos: true,
            });
        } catch (error) {
            if (abortController.signal.aborted) {
                return;
            }

            if (error instanceof NodeWithSameNameExistsValidationError) {
                this.eventCallback?.({
                    type: 'file:conflict',
                    uploadId: task.uploadId,
                    error,
                    isForPhotos: true,
                });
            } else {
                this.eventCallback?.({
                    type: 'file:error',
                    uploadId: task.uploadId,
                    error: error instanceof Error ? error : new Error(c('Error').t`Upload failed`),
                    isForPhotos: true,
                });
            }
        }
    }

    private async generateThumbnails(file: File) {
        const { thumbnailsPromise, mimeTypePromise } = generateThumbnail(file, file.name, file.size, {
            debug: Boolean(getItem('proton-drive-debug', 'false')),
        });

        const thumbnailsResult = await thumbnailsPromise;
        const mimeType = await mimeTypePromise;

        const result = thumbnailsResult.ok ? thumbnailsResult.result : undefined;
        const mediaInfo = result
            ? {
                  width: result.width,
                  height: result.height,
                  duration: result.duration,
              }
            : undefined;

        return {
            thumbnails: result?.thumbnails || [],
            mediaInfo,
            mimeType,
        };
    }

    private async createFileUploaderMetadata(
        file: File,
        mimeType: string,
        mediaInfo?: { width?: number; height?: number; duration?: number },
        isUnfinishedUpload?: boolean
    ): Promise<{
        mediaType: string;
        expectedSize: number;
        modificationTime: Date;
        overrideExistingDraftByOtherClient?: boolean;
        additionalMetadata: ExtendedAttributesMetadata | undefined;
        tags: (0 | 3 | 1 | 2 | 7 | 4 | 5 | 6 | 8 | 9)[];
        mainPhotoLinkID: string | undefined;
        captureTime: Date | undefined;
    }> {
        try {
            const { metadata, tags, captureTime } = await generatePhotosExtendedAttributes(file, mimeType, mediaInfo);
            return {
                mediaType: mimeType,
                expectedSize: file.size,
                mainPhotoLinkID: undefined,
                captureTime,
                tags: tags as (0 | 3 | 1 | 2 | 7 | 4 | 5 | 6 | 8 | 9)[],
                modificationTime: new Date(file.lastModified),
                overrideExistingDraftByOtherClient: isUnfinishedUpload,
                additionalMetadata: metadata,
            };
        } catch (error) {
            // TODO: Implement upload logging
            traceError(error, {
                level: 'debug', // Debug as we need it only when we investigate issues.
                tags: {
                    component: 'generateExtendedAttributes',
                },
            });
            return {
                mediaType: mimeType,
                expectedSize: file.size,
                mainPhotoLinkID: undefined,
                captureTime: undefined,
                tags: [],
                modificationTime: new Date(file.lastModified),
                overrideExistingDraftByOtherClient: isUnfinishedUpload,
                additionalMetadata: undefined,
            };
        }
    }
}
