import type { NodeType } from '@protontech/drive-sdk';
import { c } from 'ttag';

import { NodeWithSameNameExistsValidationError, getDrive } from '../../../index';
import { generateThumbnail } from '../../thumbnails';
import type { ExtendedAttributesMetadata, UploadTask } from '../types';
import { TaskExecutor } from './TaskExecutor';

/**
 * Executes file uploads and emits events
 * NO store access - only emits events
 */
export class FileUploadExecutor extends TaskExecutor<UploadTask & { type: NodeType.File }> {
    async execute(task: UploadTask & { type: NodeType.File }): Promise<void> {
        const abortController = new AbortController();
        try {
            const { thumbnails, mediaInfo, mimeType } = await this.generateThumbnails(task.file);
            const metadata = this.createMetadata(task.file, mimeType, mediaInfo, task.isUnfinishedUpload);

            const drive = getDrive();
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

        return {
            thumbnails: thumbnailsResult.ok ? thumbnailsResult.result?.thumbnails || [] : [],
            mediaInfo: thumbnailsResult.ok ? thumbnailsResult.result : undefined,
            mimeType,
        };
    }

    // TODO: Extract logic somewhere else, as it will grow with photos upload implementation
    private createMetadata(
        file: File,
        mimeType: string,
        mediaInfo?: { width?: number; height?: number; duration?: number },
        isUnfinishedUpload?: boolean
    ): {
        mediaType: string;
        expectedSize: number;
        modificationTime: Date;
        overrideExistingDraftByOtherClient?: boolean;
        additionalMetadata: ExtendedAttributesMetadata;
    } {
        return {
            mediaType: mimeType,
            expectedSize: file.size,
            modificationTime: new Date(file.lastModified),
            overrideExistingDraftByOtherClient: isUnfinishedUpload,
            additionalMetadata: {
                Media: {
                    Width: mediaInfo?.width,
                    Height: mediaInfo?.height,
                    Duration: mediaInfo?.duration,
                },
            },
        };
    }

    private async getUploader(
        drive: ReturnType<typeof getDrive>,
        task: UploadTask & { type: NodeType.File },
        metadata: ReturnType<typeof this.createMetadata>,
        signal: AbortSignal
    ) {
        if (task.existingNodeUid && !task.isUnfinishedUpload) {
            return drive.getFileRevisionUploader(task.existingNodeUid, metadata, signal);
        }

        return drive.getFileUploader(task.parentUid, task.name, metadata, signal);
    }
}
