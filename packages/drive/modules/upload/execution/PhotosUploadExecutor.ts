import { c } from 'ttag';

import { CryptoProxy } from '@proton/crypto';

import { NodeWithSameNameExistsValidationError, getDriveForPhotos } from '../../../index';
import { type ExtendedAttributesMetadata, generatePhotosExtendedAttributes } from '../../extendedAttributes';
import { generateThumbnail } from '../../thumbnails';
import type { PhotosUploadTask } from '../types';
import { TaskExecutor } from './TaskExecutor';

/**
 * Executes file uploads and emits events
 * NO store access - only emits events
 */
export class PhotosUploadExecutor extends TaskExecutor<PhotosUploadTask> {
    async execute(task: PhotosUploadTask): Promise<void> {
        const abortController = new AbortController();

        try {
            const driveForPhotos = getDriveForPhotos();
            const photoAlreadyExist = await driveForPhotos.isDuplicatePhoto(
                task.file.name,
                async () => {
                    const fileStream = task.file.stream();
                    const hashResult = await CryptoProxy.computeHashStream({
                        algorithm: 'unsafeSHA1',
                        dataStream: fileStream,
                    });
                    return hashResult.toHex();
                },
                abortController.signal
            );
            if (photoAlreadyExist) {
                this.eventCallback?.({
                    type: 'photo:exist',
                    uploadId: task.uploadId,
                });
                return;
            }
            const { thumbnails, mediaInfo, mimeType } = await this.generateThumbnails(task.file);
            const metadata = await this.createFileUploaderMetadata(
                task.file,
                mimeType,
                mediaInfo,
                task.isUnfinishedUpload
            );
            const uploader = await driveForPhotos.getFileUploader(task.file.name, metadata, abortController.signal);
            const controller = await uploader.uploadFromFile(task.file, thumbnails, (uploadedBytes: number) => {
                this.eventCallback?.({
                    type: 'file:progress',
                    uploadId: task.uploadId,
                    uploadedBytes,
                });
            });

            this.eventCallback?.({
                type: 'file:started',
                uploadId: task.uploadId,
                controller,
                abortController,
            });

            const { nodeUid } = await controller.completion();

            this.eventCallback?.({
                type: 'file:complete',
                uploadId: task.uploadId,
                nodeUid,
                parentUid: undefined,
                isUpdatedNode: false,
                // TODO: Not needed after Photos section migrated to SDK
                isForPhotos: true,
            });
        } catch (error) {
            if (error instanceof NodeWithSameNameExistsValidationError) {
                this.eventCallback?.({
                    type: 'file:conflict',
                    uploadId: task.uploadId,
                    error,
                });
            } else {
                this.eventCallback?.({
                    type: 'file:error',
                    uploadId: task.uploadId,
                    error: error instanceof Error ? error : new Error(c('Error').t`Upload failed`),
                });
            }
        }
    }

    private async generateThumbnails(file: File) {
        const { thumbnailsPromise, mimeTypePromise } = generateThumbnail(file, file.name, file.size, {
            debug: false,
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
        additionalMetadata: ExtendedAttributesMetadata;
        tags: (0 | 3 | 1 | 2 | 7 | 4 | 5 | 6 | 8 | 9)[];
        mainPhotoLinkID: string | undefined;
        captureTime: Date | undefined;
    }> {
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
    }
}
