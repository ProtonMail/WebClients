import { ThumbnailType, type UploadController, getDrive } from '@proton/drive';

import { ThumbnailType as LegacyThumbnailType, getMediaInfo } from '../../store/_uploads/media';
import { mediaTypeFromFile } from './utils/mediaTypeParser';

export enum UploadEventType {
    Progress = 'progress',
    Error = 'error',
    Complete = 'complete',
    ControllerReady = 'controllerReady',
}

type ProgressEvent = { uploadedBytes: number };
type ErrorEvent = { error: unknown };
type CompleteEvent = { nodeUid: string };
type ControllerReadyEvent = { controller: UploadController; abortController: AbortController };

export type UploadEvent =
    | ({ type: UploadEventType.Progress } & ProgressEvent)
    | ({ type: UploadEventType.Error } & ErrorEvent)
    | ({ type: UploadEventType.Complete } & CompleteEvent)
    | ({ type: UploadEventType.ControllerReady } & ControllerReadyEvent);

export const startUpload = async (
    file: File,
    parentUid: string,
    onChange: (event: UploadEvent) => void
): Promise<void> => {
    const drive = getDrive();
    const abortController = new AbortController();

    // TODO: Handle conflict and other errors
    try {
        // TODO: Use new thumbnail generation once it's merged
        const mediaTypePromise = mediaTypeFromFile(file);
        const mediaInfo = await getMediaInfo(mediaTypePromise, file);
        const mediaType = await mediaTypePromise;
        const metadata = { mediaType, expectedSize: file.size };

        const fileUploader = await drive.getFileUploader(parentUid, file.name, metadata, abortController.signal);
        const uploadController = await fileUploader.uploadFromFile(
            file,
            mediaInfo?.thumbnails?.map(({ thumbnailType, thumbnailData }) => ({
                type: thumbnailType === LegacyThumbnailType.PREVIEW ? ThumbnailType.Type1 : ThumbnailType.Type2,
                thumbnail: thumbnailData,
            })) || [],
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
        onChange({
            type: UploadEventType.Error,
            error,
        });
    }
};
