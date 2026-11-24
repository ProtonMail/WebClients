import type { ProtonDriveClient } from '@proton/drive/sdk';
import { ConnectionError, NodeWithSameNameExistsValidationError, ValidationError } from '@proton/drive/sdk';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import type { DriveFile } from '../saveToDrive';
import { SaveToDriveError, saveToDrive } from '../saveToDrive';

const root = { uid: 'volume~root' };
const bytes = new Uint8Array([1, 2, 3, 4]);
const file: DriveFile = { data: bytes, name: 'invoice.pdf', mediaType: 'application/pdf', size: bytes.byteLength };

const sameNameError = () => {
    return new NodeWithSameNameExistsValidationError('A file with this name already exists', 2500);
};
const validationError = (code: number) => {
    return new ValidationError('Refused', code);
};

const readStream = async (stream: ReadableStream<Uint8Array<ArrayBuffer>>) => {
    const chunks: number[] = [];
    const reader = stream.getReader();
    let result = await reader.read();
    while (!result.done) {
        chunks.push(...result.value);
        result = await reader.read();
    }
    return chunks;
};

const setup = () => {
    const uploaded: number[][] = [];
    const completion = vi.fn().mockResolvedValue({ nodeUid: 'volume~file', nodeRevisionUid: 'volume~file~revision' });
    // Reads the whole stream before answering, as the SDK does before Drive reports a taken name.
    const uploadFromStream = vi.fn(async (stream: ReadableStream<Uint8Array<ArrayBuffer>>) => {
        uploaded.push(await readStream(stream));
        return { completion };
    });
    const getFileUploader = vi.fn().mockResolvedValue({ uploadFromStream });
    const getMyFilesRootFolder = vi.fn().mockResolvedValue(root);
    const getAvailableName = vi.fn().mockResolvedValue('invoice (1).pdf');
    const drive = { getMyFilesRootFolder, getFileUploader, getAvailableName } as unknown as ProtonDriveClient;

    return { drive, uploaded, completion, uploadFromStream, getFileUploader, getMyFilesRootFolder, getAvailableName };
};

const getSaveFailure = async (drive: ProtonDriveClient) => {
    try {
        await saveToDrive(drive, file);
    } catch (error) {
        return error as SaveToDriveError;
    }
    throw new Error('Expected the save to fail');
};

describe('saveToDrive', () => {
    it("uploads to the My files root with the file's name, type and exact byte size, and returns the new node and its name", async () => {
        const { drive, uploaded, uploadFromStream, getFileUploader } = setup();

        await expect(saveToDrive(drive, file)).resolves.toEqual({ nodeUid: 'volume~file', name: 'invoice.pdf' });

        expect(getFileUploader).toHaveBeenCalledWith(root, 'invoice.pdf', {
            mediaType: 'application/pdf',
            expectedSize: 4,
        });
        expect(uploadFromStream).toHaveBeenCalledWith(expect.any(ReadableStream), []);
        expect(uploaded).toEqual([[1, 2, 3, 4]]);
    });

    it('saves under the free name Drive suggests when the name is taken', async () => {
        const { drive, uploaded, completion, getFileUploader, getAvailableName } = setup();
        completion.mockRejectedValueOnce(sameNameError());

        await expect(saveToDrive(drive, file)).resolves.toEqual({ nodeUid: 'volume~file', name: 'invoice (1).pdf' });

        expect(getAvailableName).toHaveBeenCalledWith(root, 'invoice.pdf', 'file');
        expect(getFileUploader).toHaveBeenLastCalledWith(root, 'invoice (1).pdf', {
            mediaType: 'application/pdf',
            expectedSize: 4,
        });
        expect(uploaded).toEqual([
            [1, 2, 3, 4],
            [1, 2, 3, 4],
        ]);
    });

    it('reports something else when the free name is taken too, without a third attempt', async () => {
        const { drive, completion, getFileUploader, getAvailableName } = setup();
        const secondError = sameNameError();
        completion.mockRejectedValueOnce(sameNameError()).mockRejectedValueOnce(secondError);

        const failure = await getSaveFailure(drive);

        expect(failure).toBeInstanceOf(SaveToDriveError);
        expect(failure.reason).toBe('other');
        expect(failure.cause).toBe(secondError);
        expect(getAvailableName).toHaveBeenCalledTimes(1);
        expect(getFileUploader).toHaveBeenCalledTimes(2);
    });

    it('reports not enough storage when Drive refuses for quota', async () => {
        const { drive, completion } = setup();
        const quotaError = validationError(API_CUSTOM_ERROR_CODES.INSUFFICIENT_STORAGE);
        completion.mockRejectedValueOnce(quotaError);

        const failure = await getSaveFailure(drive);

        expect(failure.reason).toBe('storageFull');
        expect(failure.cause).toBe(quotaError);
    });

    it('reports not enough storage when the upload under the free name is refused for quota', async () => {
        const { drive, completion, getFileUploader } = setup();
        const quotaError = validationError(API_CUSTOM_ERROR_CODES.INSUFFICIENT_STORAGE);
        completion.mockRejectedValueOnce(sameNameError()).mockRejectedValueOnce(quotaError);

        const failure = await getSaveFailure(drive);

        expect(failure.reason).toBe('storageFull');
        expect(failure.cause).toBe(quotaError);
        expect(getFileUploader).toHaveBeenLastCalledWith(root, 'invoice (1).pdf', expect.anything());
    });

    it("reports something else with Drive's own message when My files can't be set up", async () => {
        const { drive, getMyFilesRootFolder, getFileUploader } = setup();
        const setupError = new ValidationError(
            "Please verify your account's email address",
            API_CUSTOM_ERROR_CODES.NOT_ALLOWED
        );
        getMyFilesRootFolder.mockRejectedValueOnce(setupError);

        const failure = await getSaveFailure(drive);

        expect(failure.reason).toBe('other');
        expect(failure.driveMessage).toBe("Please verify your account's email address");
        expect(failure.cause).toBe(setupError);
        expect(getFileUploader).not.toHaveBeenCalled();
    });

    it('reports something else for any other failure, such as a network error', async () => {
        const { drive, uploadFromStream } = setup();
        const networkError = new ConnectionError('Network failure');
        uploadFromStream.mockRejectedValueOnce(networkError);

        const failure = await getSaveFailure(drive);

        expect(failure.reason).toBe('other');
        expect(failure.driveMessage).toBe('Network failure');
        expect(failure.cause).toBe(networkError);
    });

    it('has no Drive message when the failure is not from Drive', async () => {
        const { drive, uploadFromStream } = setup();
        uploadFromStream.mockRejectedValueOnce(new TypeError('Unexpected'));

        const failure = await getSaveFailure(drive);

        expect(failure.reason).toBe('other');
        expect(failure.driveMessage).toBeUndefined();
    });
});
