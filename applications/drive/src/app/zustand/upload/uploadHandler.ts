import { type UploadController, getDrive } from '@proton/drive';

import { mediaTypeFromFile } from './utils/mediaTypeParser';

export enum UploadEventType {
    Progress = 'progress',
    Error = 'error',
    Complete = 'complete',
    ControllerReady = 'controllerReady',
}

type ProgressEvent = { progress: number };
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
        const mediaType = await mediaTypeFromFile(file);

        const metadata = { mediaType: mediaType, expectedSize: file.size };

        const fileUploader = await drive.getFileUploader(parentUid, file.name, metadata, abortController.signal);
        const uploadController = await fileUploader.uploadFromFile(file, [], (uploadedBytes: number) => {
            onChange({
                type: UploadEventType.Progress,
                progress: Math.min(100, (uploadedBytes / metadata.expectedSize) * 100),
            });
        });

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
