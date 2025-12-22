import type { TransferMeta } from '../../../components/TransferManager/transfer';
import { createDeferred, flushAsync } from '../testUtils';
import { createStreamSaver } from './createStreamSaver';

jest.mock('../../../store/_downloads/fileSaver/fileSaver', () => {
    const saveAsFile = jest.fn();
    return {
        __esModule: true,
        default: {
            instance: {
                saveAsFile,
            },
        },
        __mockedSaveAsFile: saveAsFile,
    };
});

jest.mock('../../../utils/webStreamsPolyfill', () => {
    const loadCreateReadableStreamWrapper = jest.fn();
    return {
        loadCreateReadableStreamWrapper,
        __mockedWrapper: loadCreateReadableStreamWrapper,
    };
});

const { __mockedSaveAsFile: fileSaverSaveAsFileMock } = require('../../../store/_downloads/fileSaver/fileSaver') as {
    __mockedSaveAsFile: jest.Mock;
};

const { __mockedWrapper: loadCreateReadableStreamWrapperMock } = require('../../../utils/webStreamsPolyfill') as {
    __mockedWrapper: jest.Mock;
};

describe('createStreamSaver', () => {
    const meta: TransferMeta = { filename: 'file.txt', mimeType: 'text/plain', size: 42 };
    const log = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should finalize the writable stream and forwards chunks to fileSaver', async () => {
        const chunk = new Uint8Array([1, 2, 3]);
        const receivedChunks: Uint8Array<ArrayBuffer>[] = [];
        const completion = createDeferred<void>();
        let forwardedReadable: ReadableStream<Uint8Array<ArrayBuffer>> | undefined;

        loadCreateReadableStreamWrapperMock.mockImplementation(async (stream) => {
            forwardedReadable = stream;
            return stream;
        });

        fileSaverSaveAsFileMock.mockImplementation(async (stream: ReadableStream<Uint8Array<ArrayBuffer>>) => {
            const reader = stream.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                receivedChunks.push(value);
            }
            await completion.promise;
        });

        const streamSaver = createStreamSaver(meta, log);
        const writer = streamSaver.writable.getWriter();
        await writer.write(chunk);
        writer.releaseLock();

        let finalized = false;
        const finalizePromise = streamSaver.finalize().then(() => {
            finalized = true;
        });

        await flushAsync();
        expect(finalized).toBe(false);

        completion.resolve();
        await finalizePromise;

        expect(fileSaverSaveAsFileMock).toHaveBeenCalledWith(forwardedReadable, meta, log);
        expect(receivedChunks).toHaveLength(1);
        expect(Array.from(receivedChunks[0])).toEqual(Array.from(chunk));
    });

    it('should abort only once and cancels the wrapped stream when download fails', async () => {
        const reason = new Error('stop');
        const cancelMock = jest.fn();
        const mockReadable = { cancel: cancelMock } as unknown as ReadableStream<Uint8Array<ArrayBuffer>>;

        loadCreateReadableStreamWrapperMock.mockResolvedValue(mockReadable);
        fileSaverSaveAsFileMock.mockRejectedValue(new Error('save failed'));

        const streamSaver = createStreamSaver(meta, log);
        await expect(streamSaver.abort(reason)).resolves.toBeUndefined();
        expect(cancelMock).toHaveBeenCalledWith(reason);
        expect(fileSaverSaveAsFileMock).toHaveBeenCalledTimes(1);

        await streamSaver.abort(new Error('another attempt'));
        expect(cancelMock).toHaveBeenCalledTimes(1);
    });
});
