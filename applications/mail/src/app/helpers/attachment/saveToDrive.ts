import type { NodeOrUid, ProtonDriveClient } from '@protontech/drive-sdk';

interface SaveToDriveOptions {
    name: string;
    type: string;
    // The unencrypted size of the file, used for integrity verification
    size: number;
    stream: ReadableStream;
    // The destination folder
    folder: NodeOrUid;
}

/**
 * Saves a file to a folder in Proton Drive
 * @param client - The Proton Drive client instance
 * @param options - The options for the save operation
 * @returns The UID of the saved file
 */
export const saveToDrive = async function (
    client: ProtonDriveClient,
    { name, type, size, folder, stream }: SaveToDriveOptions
) {
    // TODO: add support for duplicate name handling.
    // useUploadHelper has an embedded util called findAvailableName that can be
    // repurposed here.
    const uploader = await client.getFileUploader(folder, name, { mediaType: type, expectedSize: size });
    const uploadController = await uploader.writeStream(stream, []);
    const nodeUid = await uploadController.completion();

    return nodeUid;
};
