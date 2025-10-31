import {
    NodeType,
    NodeWithSameNameExistsValidationError,
    type ProtonDriveClient,
    type UploadController,
    getDrive,
} from '@proton/drive';
import { generateThumbnail } from '@proton/drive/modules/thumbnails';
import { getItem } from '@proton/shared/lib/helpers/storage';

import { UploadConflictStrategy, UploadConflictType } from './types';

export enum UploadEventType {
    Progress = 'progress',
    Error = 'error',
    Complete = 'complete',
    ControllerReady = 'controllerReady',
    ConflictFound = 'conflictFound',
    Skip = 'skip',
}

type ConflictFoundEvent = {
    name: string;
    nodeType?: NodeType;
};

type ProgressEvent = { uploadedBytes: number };
type ErrorEvent = { error: unknown };
type CompleteEvent = { nodeUid: string };
type ControllerReadyEvent = { controller: UploadController; abortController: AbortController };

export type UploadEvent =
    | ({ type: UploadEventType.Progress } & ProgressEvent)
    | { type: UploadEventType.Skip }
    | ({ type: UploadEventType.Error } & ErrorEvent)
    | ({ type: UploadEventType.Complete } & CompleteEvent)
    | ({ type: UploadEventType.ControllerReady } & ControllerReadyEvent)
    | ({ type: UploadEventType.ConflictFound } & ConflictFoundEvent);

interface UploadMetadata {
    mediaType: string;
    expectedSize: number;
    overrideExistingDraftByOtherClient?: boolean;
    modificationTime?: Date;
    additionalMetadata: {
        media: {
            width?: number;
            height?: number;
            duration?: number;
        };
    };
}

function createUploadMetadata(params: {
    mediaType: string;
    fileSize: number;
    modificationTime?: Date;
    mediaInfo?: {
        width?: number;
        height?: number;
        duration?: number;
    };
}): UploadMetadata {
    const { mediaType, fileSize, modificationTime, mediaInfo } = params;

    const metadata: UploadMetadata = {
        mediaType,
        expectedSize: fileSize,
        additionalMetadata: {
            media: {
                width: mediaInfo?.width,
                height: mediaInfo?.height,
                duration: mediaInfo?.duration,
            },
        },
        modificationTime,
    };

    return metadata;
}

async function getUploaderForStrategy(
    drive: {
        getFileUploader: ProtonDriveClient['getFileUploader'];
        getFileRevisionUploader: ProtonDriveClient['getFileRevisionUploader'];
        getAvailableName: ProtonDriveClient['getAvailableName'];
    },
    params: {
        strategy: UploadConflictStrategy.Rename | UploadConflictStrategy.Replace;
        isUnfinishedUpload: boolean;
        parentUid: string;
        fileName: string;
        metadata: UploadMetadata;
        signal: AbortSignal;
        existingNodeUid?: string;
    }
) {
    const { strategy, isUnfinishedUpload, parentUid, fileName, metadata, signal, existingNodeUid } = params;

    if (strategy === UploadConflictStrategy.Replace) {
        if (isUnfinishedUpload) {
            metadata.overrideExistingDraftByOtherClient = true;
            return drive.getFileUploader(parentUid, fileName, metadata, signal);
        }
        if (existingNodeUid) {
            return drive.getFileRevisionUploader(existingNodeUid, metadata, signal);
        }
    }

    if (strategy === UploadConflictStrategy.Rename) {
        const availableName = await drive.getAvailableName(parentUid, fileName);
        return drive.getFileUploader(parentUid, availableName, metadata, signal);
    }

    throw new Error(`Unknown strategy: ${strategy}`);
}

export const startUpload = async (
    file: File,
    parentUid: string,
    onChange: (event: UploadEvent) => void,
    onConflict?: (name: string, nodeType: NodeType, conflictType: UploadConflictType) => Promise<UploadConflictStrategy>
): Promise<void> => {
    const drive = getDrive();
    const abortController = new AbortController();
    const { mimeTypePromise, thumbnailsPromise } = generateThumbnail(file, file.name, file.size, {
        debug: Boolean(getItem('proton-drive-debug', 'false')),
    });
    const thumbnailsResult = await thumbnailsPromise;
    const mediaInfo = thumbnailsResult.ok
        ? {
              duration: thumbnailsResult.result?.duration,
              width: thumbnailsResult.result?.width,
              height: thumbnailsResult.result?.height,
          }
        : undefined;
    try {
        const metadata = createUploadMetadata({
            mediaType: await mimeTypePromise,
            fileSize: file.size,
            modificationTime: new Date(file.lastModified),
            mediaInfo,
        });

        const fileUploader = await drive.getFileUploader(parentUid, file.name, metadata, abortController.signal);
        const uploadController = await fileUploader.uploadFromFile(
            file,
            thumbnailsResult.ok && thumbnailsResult.result?.thumbnails ? thumbnailsResult.result?.thumbnails : [],
            (uploadedBytes: number) => {
                onChange({
                    type: UploadEventType.Progress,
                    uploadedBytes,
                });
            }
        );

        onChange({ type: UploadEventType.ControllerReady, controller: uploadController, abortController });

        const { nodeUid } = await uploadController.completion();

        onChange({ type: UploadEventType.Complete, nodeUid });
    } catch (error) {
        if (error instanceof NodeWithSameNameExistsValidationError) {
            onChange({
                type: UploadEventType.ConflictFound,
                name: file.name,
                nodeType: NodeType.File,
            });

            if (!onConflict) {
                onChange({
                    type: UploadEventType.Error,
                    error,
                });
                return;
            }

            const isUnfinishedUpload = error.isUnfinishedUpload;
            const strategy = await onConflict(
                file.name,
                NodeType.File,
                isUnfinishedUpload ? UploadConflictType.Draft : UploadConflictType.Normal
            );

            if (strategy === UploadConflictStrategy.Skip) {
                onChange({
                    type: UploadEventType.Skip,
                });
                return;
            }

            const metadata = createUploadMetadata({
                mediaType: await mimeTypePromise,
                fileSize: file.size,
            });

            const fileUploader = await getUploaderForStrategy(drive, {
                strategy: strategy,
                isUnfinishedUpload,
                parentUid,
                fileName: file.name,
                metadata,
                signal: abortController.signal,
                existingNodeUid: error.existingNodeUid,
            });

            const uploadController = await fileUploader.uploadFromFile(
                file,
                thumbnailsResult.ok && thumbnailsResult.result?.thumbnails ? thumbnailsResult.result?.thumbnails : [],
                (uploadedBytes: number) => {
                    onChange({
                        type: UploadEventType.Progress,
                        uploadedBytes,
                    });
                }
            );

            onChange({ type: UploadEventType.ControllerReady, controller: uploadController, abortController });
            const { nodeUid } = await uploadController.completion();
            onChange({ type: UploadEventType.Complete, nodeUid });
            return;
        }
        onChange({
            type: UploadEventType.Error,
            error,
        });
    }
};
