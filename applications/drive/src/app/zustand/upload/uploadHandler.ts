import {
    NodeType,
    NodeWithSameNameExistsValidationError,
    type ProtonDriveClient,
    ThumbnailType,
    type UploadController,
    getDrive,
} from '@proton/drive';

import { ThumbnailType as LegacyThumbnailType, type ThumbnailInfo, getMediaInfo } from '../../store/_uploads/media';
import { UploadConflictStrategy, UploadConflictType } from './types';
import { mediaTypeFromFile } from './utils/mediaTypeParser';

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

const legacyThumbnailAdapter = (thumbnails: ThumbnailInfo[]) =>
    thumbnails.map(({ thumbnailType, thumbnailData }) => {
        return {
            type: thumbnailType === LegacyThumbnailType.PREVIEW ? ThumbnailType.Type1 : ThumbnailType.Type2,
            thumbnail: thumbnailData,
        };
    });

export type UploadEvent =
    | ({ type: UploadEventType.Progress } & ProgressEvent)
    | { type: UploadEventType.Skip }
    | ({ type: UploadEventType.Error } & ErrorEvent)
    | ({ type: UploadEventType.Complete } & CompleteEvent)
    | ({ type: UploadEventType.ControllerReady } & ControllerReadyEvent)
    | ({ type: UploadEventType.ConflictFound } & ConflictFoundEvent);

interface MediaData {
    mediaInfo: Awaited<ReturnType<typeof getMediaInfo>>;
    mediaType: string;
}

interface UploadMetadata {
    mediaType: string;
    expectedSize: number;
    overrideExistingDraftByOtherClient?: boolean;
    modificationTime?: Date;
    additionalMetadata?: {
        width: number;
        height: number;
        duration?: number;
    };
}

async function prepareMediaData(file: File): Promise<MediaData> {
    const mediaTypePromise = mediaTypeFromFile(file);
    const mediaInfo = await getMediaInfo(mediaTypePromise, file);
    const mediaType = await mediaTypePromise;
    return { mediaInfo, mediaType };
}

function createUploadMetadata(params: {
    mediaType: string;
    fileSize: number;
    modificationTime?: Date;
    mediaInfo?: MediaData['mediaInfo'];
}): UploadMetadata {
    const { mediaType, fileSize, modificationTime, mediaInfo } = params;

    const metadata: UploadMetadata = {
        mediaType,
        expectedSize: fileSize,
    };

    if (modificationTime) {
        metadata.modificationTime = modificationTime;
    }

    if (mediaInfo && mediaInfo.width !== undefined && mediaInfo.height !== undefined) {
        metadata.additionalMetadata = {
            width: mediaInfo.width,
            height: mediaInfo.height,
        };
        if (mediaInfo.duration !== undefined) {
            metadata.additionalMetadata.duration = mediaInfo.duration;
        }
    }

    return metadata;
}

async function getUploaderForStrategy(
    drive: {
        getFileUploader: ProtonDriveClient['getFileUploader'];
        getFileRevisionUploader: ProtonDriveClient['getFileRevisionUploader'];
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
        const tempUploader = await drive.getFileUploader(parentUid, fileName, metadata, signal);
        const availableName = await tempUploader.getAvailableName();
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
    const { mediaInfo, mediaType } = await prepareMediaData(file);

    try {
        const metadata = createUploadMetadata({
            mediaType,
            fileSize: file.size,
            modificationTime: new Date(file.lastModified),
            mediaInfo,
        });

        const fileUploader = await drive.getFileUploader(parentUid, file.name, metadata, abortController.signal);
        const uploadController = await fileUploader.uploadFromFile(
            file,
            mediaInfo?.thumbnails ? legacyThumbnailAdapter(mediaInfo.thumbnails) : [],
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
                mediaType,
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
                mediaInfo?.thumbnails ? legacyThumbnailAdapter(mediaInfo.thumbnails) : [],
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
