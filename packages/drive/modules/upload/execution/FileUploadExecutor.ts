import { c } from 'ttag';

import { traceError } from '@proton/shared/lib/helpers/sentry';
import { getItem } from '@proton/shared/lib/helpers/storage';

import {
    NodeWithSameNameExistsValidationError,
    type ProtonDriveClient,
    type ProtonDrivePublicLinkClient,
} from '../../../index';
import { type ExtendedAttributesMetadata, generateExtendedAttributes } from '../../extendedAttributes';
import { generateThumbnail } from '../../thumbnails';
import { UploadDriveClientRegistry } from '../UploadDriveClientRegistry';
import { useUploadControllerStore } from '../store/uploadController.store';
import type { FileUploadTask } from '../types';
import { createFileStream } from '../utils/createFileStream';
import { TaskExecutor } from './TaskExecutor';

/**
 * Executes file uploads and emits events
 * NO store access - only emits events
 */
// TODO: Improve abort check and update thumbnail generator to support abortController
export class FileUploadExecutor extends TaskExecutor<FileUploadTask> {
    async execute(task: FileUploadTask): Promise<void> {
        const storedController = useUploadControllerStore.getState().getController(task.uploadId);

        if (!storedController) {
            return;
        }

        const abortController = storedController.abortController;

        if (abortController.signal.aborted) {
            return;
        }

        try {
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

            const drive = UploadDriveClientRegistry.getDriveClient();
            const uploader = await this.getUploader(drive, task, metadata, abortController.signal);

            const stream = createFileStream(task.file);
            const controller = await uploader.uploadFromStream(stream, thumbnails, (uploadedBytes: number) => {
                this.eventCallback?.({
                    type: 'file:progress',
                    uploadId: task.uploadId,
                    uploadedBytes,
                    isForPhotos: false,
                });
            });

            this.eventCallback?.({
                type: 'file:started',
                uploadId: task.uploadId,
                controller,
                isForPhotos: false,
            });

            const { nodeUid } = await controller.completion();

            this.eventCallback?.({
                type: 'file:complete',
                uploadId: task.uploadId,
                nodeUid,
                parentUid: task.parentUid,
                isUpdatedNode: Boolean(task.existingNodeUid),
                isForPhotos: false,
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
                    isForPhotos: false,
                });
            } else {
                this.eventCallback?.({
                    type: 'file:error',
                    uploadId: task.uploadId,
                    error: error instanceof Error ? error : new Error(c('Error').t`Upload failed`),
                    isForPhotos: false,
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
    }> {
        try {
            const { metadata } = await generateExtendedAttributes(file, mimeType, mediaInfo);
            return {
                mediaType: mimeType,
                expectedSize: file.size,
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
                modificationTime: new Date(file.lastModified),
                overrideExistingDraftByOtherClient: isUnfinishedUpload,
                additionalMetadata: undefined,
            };
        }
    }

    private async getUploader(
        drive: ProtonDriveClient | ProtonDrivePublicLinkClient,
        task: FileUploadTask,
        metadata: {
            mediaType: string;
            expectedSize: number;
            modificationTime: Date;
            overrideExistingDraftByOtherClient?: boolean;
            additionalMetadata: ExtendedAttributesMetadata | undefined;
        },
        signal: AbortSignal
    ) {
        if (task.existingNodeUid && !task.isUnfinishedUpload) {
            return drive.getFileRevisionUploader(task.existingNodeUid, metadata, signal);
        }

        return drive.getFileUploader(task.parentUid, task.name, metadata, signal);
    }
}
