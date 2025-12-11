import { c } from 'ttag';

import {
    NodeWithSameNameExistsValidationError,
    type ProtonDriveClient,
    type ProtonDrivePublicLinkClient,
} from '../../../index';
import { type ExtendedAttributesMetadata, generateExtendedAttributes } from '../../extendedAttributes';
import { generateThumbnail } from '../../thumbnails';
import type { FileUploadTask } from '../types';
import { TaskExecutor } from './TaskExecutor';

/**
 * Executes file uploads and emits events
 * NO store access - only emits events
 */
export class FileUploadExecutor extends TaskExecutor<FileUploadTask> {
    async execute(task: FileUploadTask): Promise<void> {
        const abortController = new AbortController();
        try {
            const { thumbnails, mediaInfo, mimeType } = await this.generateThumbnails(task.file);
            const metadata = await this.createFileUploaderMetadata(
                task.file,
                mimeType,
                mediaInfo,
                task.isUnfinishedUpload
            );

            const drive = this.driveClient;
            const uploader = await this.getUploader(drive, task, metadata, abortController.signal);

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
                parentUid: task.parentUid,
                isUpdatedNode: Boolean(task.existingNodeUid),
                isForPhotos: task.isForPhotos,
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
    }> {
        const { metadata } = await generateExtendedAttributes(file, mimeType, mediaInfo);
        return {
            mediaType: mimeType,
            expectedSize: file.size,
            modificationTime: new Date(file.lastModified),
            overrideExistingDraftByOtherClient: isUnfinishedUpload,
            additionalMetadata: metadata,
        };
    }

    private async getUploader(
        drive: ProtonDriveClient | ProtonDrivePublicLinkClient,
        task: FileUploadTask,
        metadata: {
            mediaType: string;
            expectedSize: number;
            modificationTime: Date;
            overrideExistingDraftByOtherClient?: boolean;
            additionalMetadata: ExtendedAttributesMetadata;
        },
        signal: AbortSignal
    ) {
        if (task.existingNodeUid && !task.isUnfinishedUpload) {
            return drive.getFileRevisionUploader(task.existingNodeUid, metadata, signal);
        }

        return drive.getFileUploader(task.parentUid, task.name, metadata, signal);
    }
}
