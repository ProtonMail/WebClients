import { sha1 } from '@noble/hashes/sha1';
import { bytesToHex } from '@noble/hashes/utils';

import type { DownloadController, NodeEntity } from '@proton/drive';

import { useDownloadManagerStore } from '../../../zustand/download/downloadManager.store';
import type { MalwareDetection } from '../malwareDetection/malwareDetection';
import { createFileDownloadStream } from './createFileDownloadStream';
import { getDownloadSdk } from './getDownloadSdk';

jest.mock('../../../zustand/download/downloadManager.store', () => ({
    useDownloadManagerStore: { getState: jest.fn() },
}));
jest.mock('./getDownloadSdk', () => ({ getDownloadSdk: jest.fn() }));

const mockGetDownloadSdk = getDownloadSdk as jest.MockedFunction<typeof getDownloadSdk>;
const mockGetState = useDownloadManagerStore.getState as jest.MockedFunction<typeof useDownloadManagerStore.getState>;

describe('createFileDownloadStream', () => {
    const downloadId = 'test-id';
    const node = { uid: 'node-uid', name: 'test.txt' } as NodeEntity;
    const abortSignal = new AbortController().signal;
    const onProgress = jest.fn();
    const malwareDetection = {
        wrapStream: jest.fn((_, __, stream) => stream),
    } as unknown as MalwareDetection;

    const setupMocks = (revisionUid?: string) => {
        const mockController = {
            completion: jest.fn().mockResolvedValue(undefined),
        } as unknown as DownloadController;

        const mockDownloader = {
            getClaimedSizeInBytes: jest.fn().mockReturnValue(1024),
            downloadToStream: jest.fn().mockReturnValue(mockController),
        };

        mockGetState.mockReturnValue({
            getQueueItem: jest.fn().mockReturnValue({ revisionUid }),
        } as any);

        return { mockDownloader, mockController };
    };

    beforeEach(() => jest.clearAllMocks());

    it('should use getFileDownloader for regular files', async () => {
        const { mockDownloader } = setupMocks();
        const mockDrive = { getFileDownloader: jest.fn().mockResolvedValue(mockDownloader) };
        mockGetDownloadSdk.mockReturnValue(mockDrive as any);

        const result = await createFileDownloadStream({ downloadId, node, abortSignal, onProgress, malwareDetection });

        expect(mockDrive.getFileDownloader).toHaveBeenCalledWith(node.uid, abortSignal);
        expect(result.claimedSize).toBe(1024);
        expect(result.isWriterClosed()).toBe(false);
    });

    it('should use getFileRevisionDownloader when revisionUid exists', async () => {
        const { mockDownloader } = setupMocks('revision-123');
        const mockDrive = { getFileRevisionDownloader: jest.fn().mockResolvedValue(mockDownloader) };
        mockGetDownloadSdk.mockReturnValue(mockDrive as any);

        await createFileDownloadStream({ downloadId, node, abortSignal, onProgress, malwareDetection });

        expect(mockDrive.getFileRevisionDownloader).toHaveBeenCalledWith('revision-123', abortSignal);
    });

    it('should fall back to getFileDownloader when getFileRevisionDownloader unavailable', async () => {
        const { mockDownloader } = setupMocks('revision-123');
        const mockDrive = { getFileDownloader: jest.fn().mockResolvedValue(mockDownloader) };
        mockGetDownloadSdk.mockReturnValue(mockDrive as any);

        await createFileDownloadStream({ downloadId, node, abortSignal, onProgress, malwareDetection });

        expect(mockDrive.getFileDownloader).toHaveBeenCalledWith(node.uid, abortSignal);
    });

    it('should forward progress callbacks', async () => {
        const { mockDownloader } = setupMocks();
        mockGetDownloadSdk.mockReturnValue({ getFileDownloader: jest.fn().mockResolvedValue(mockDownloader) } as any);

        await createFileDownloadStream({ downloadId, node, abortSignal, onProgress, malwareDetection });

        const progressCallback = mockDownloader.downloadToStream.mock.calls[0][1];
        progressCallback(512);

        expect(onProgress).toHaveBeenCalledWith(512);
    });

    it('should track writer closed state', async () => {
        const { mockDownloader } = setupMocks();
        mockGetDownloadSdk.mockReturnValue({ getFileDownloader: jest.fn().mockResolvedValue(mockDownloader) } as any);

        const result = await createFileDownloadStream({ downloadId, node, abortSignal, onProgress, malwareDetection });
        const writableStream = mockDownloader.downloadToStream.mock.calls[0][0];

        expect(result.isWriterClosed()).toBe(false);
        await writableStream.close();
        expect(result.isWriterClosed()).toBe(true);
    });

    it('should not close writer twice', async () => {
        const { mockDownloader } = setupMocks();
        mockGetDownloadSdk.mockReturnValue({ getFileDownloader: jest.fn().mockResolvedValue(mockDownloader) } as any);

        const result = await createFileDownloadStream({ downloadId, node, abortSignal, onProgress, malwareDetection });
        const writableStream = mockDownloader.downloadToStream.mock.calls[0][0];
        await writableStream.close();

        expect(result.isWriterClosed()).toBe(true);

        // Calling closeWriter again should be safe (idempotent)
        expect(() => result.closeWriter()).not.toThrow();
        expect(result.isWriterClosed()).toBe(true);
    });

    it('should allow aborting writer', async () => {
        const { mockDownloader } = setupMocks();
        mockGetDownloadSdk.mockReturnValue({ getFileDownloader: jest.fn().mockResolvedValue(mockDownloader) } as any);

        const result = await createFileDownloadStream({ downloadId, node, abortSignal, onProgress, malwareDetection });

        expect(result.isWriterClosed()).toBe(false);
        result.abortWriter(new Error('Test abort'));
        expect(result.isWriterClosed()).toBe(true);
    });

    it('should compute hash incrementally and cache final result', async () => {
        const { mockDownloader } = setupMocks();
        mockGetDownloadSdk.mockReturnValue({ getFileDownloader: jest.fn().mockResolvedValue(mockDownloader) } as any);

        const result = await createFileDownloadStream({ downloadId, node, abortSignal, onProgress, malwareDetection });

        const readable = result.stream.getReader();
        const drainPromise = (async () => {
            while (!(await readable.read()).done) {}
        })();

        const writableStream = mockDownloader.downloadToStream.mock.calls[0][0];
        const writer = writableStream.getWriter();
        const chunk1 = new Uint8Array([1, 2, 3]);
        const chunk2 = new Uint8Array([4, 5]);

        await writer.write(chunk1);
        const hashAfterFirst = result.computeDownloadedHash();

        await writer.write(chunk2);
        await writer.close();
        await drainPromise;

        const expectedHash = sha1.create();
        expectedHash.update(chunk1);
        const expectedFirst = bytesToHex(expectedHash.clone().digest());
        expectedHash.update(chunk2);
        const expectedFinal = bytesToHex(expectedHash.digest());

        expect(hashAfterFirst).toBe(expectedFirst);
        expect(result.computeDownloadedHash()).toBe(expectedFinal);
        expect(result.computeDownloadedHash()).toBe(expectedFinal); // Cached
    });
});
