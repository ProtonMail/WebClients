import type { NodeEntity, ProtonDriveClient } from '@proton/drive/sdk';
import { NodeType, NodeWithSameNameExistsValidationError, ProtonDriveError, ValidationError } from '@proton/drive/sdk';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

/*
 * This file imports Drive SDK code, so Mail must only load it with a dynamic import, never statically, to keep the
 * SDK out of Mail's main bundle.
 */

export interface DriveFile {
    data: Uint8Array<ArrayBuffer>;
    name: string;
    mediaType: string;
    size: number;
}

type SaveToDriveFailureReason = 'storageFull' | 'other';

export class SaveToDriveError extends Error {
    readonly reason: SaveToDriveFailureReason;
    /** Drive's own translated explanation, to show as is. Undefined when the failure didn't come from Drive. */
    readonly driveMessage?: string;

    constructor(reason: SaveToDriveFailureReason, cause: unknown) {
        super(reason, { cause });

        this.name = 'SaveToDriveError';
        this.reason = reason;
        this.driveMessage = cause instanceof ProtonDriveError ? cause.message : undefined;
    }
}

const isStorageFull = (error: unknown) => {
    return error instanceof ValidationError && error.code === API_CUSTOM_ERROR_CODES.INSUFFICIENT_STORAGE;
};

const upload = async (drive: ProtonDriveClient, root: NodeEntity, file: DriveFile, name: string) => {
    // A new stream for each attempt: the SDK reads the whole stream before Drive reports a taken name.
    const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
        start(controller) {
            controller.enqueue(file.data);
            controller.close();
        },
    });
    const uploader = await drive.getFileUploader(root, name, { mediaType: file.mediaType, expectedSize: file.size });
    const controller = await uploader.uploadFromStream(stream, []);
    const { nodeUid } = await controller.completion();

    return { nodeUid, name };
};

const uploadUnderFreeName = async (drive: ProtonDriveClient, root: NodeEntity, file: DriveFile) => {
    try {
        return await upload(drive, root, file, file.name);
    } catch (error) {
        if (!(error instanceof NodeWithSameNameExistsValidationError)) {
            throw error;
        }
        const freeName = await drive.getAvailableName(root, file.name, NodeType.File);
        return upload(drive, root, file, freeName);
    }
};

/**
 * Uploads a file to the root of My files, setting up Drive first for someone who has never used it. If the name
 * is taken, it's saved once more under the free name Drive suggests. Failures are thrown as a SaveToDriveError:
 * `storageFull` when Drive is out of space, otherwise `other` with Drive's own message to show.
 */
export const saveToDrive = async (drive: ProtonDriveClient, file: DriveFile) => {
    try {
        const root = await drive.getMyFilesRootFolder();
        return await uploadUnderFreeName(drive, root, file);
    } catch (error) {
        throw new SaveToDriveError(isStorageFull(error) ? 'storageFull' : 'other', error);
    }
};
