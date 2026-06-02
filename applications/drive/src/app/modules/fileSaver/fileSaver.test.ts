import 'web-streams-polyfill/polyfill/es5';

import { featureFlagStore } from '@proton/drive/modules/flags';
import { MEMORY_DOWNLOAD_LIMIT } from '@proton/shared/lib/drive/constants';
import { getCookie } from '@proton/shared/lib/helpers/cookies';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import type { UnleashClient } from '@proton/unleash/UnleashClient';

import { streamToBuffer } from '../../utils/stream';
import { initDownloadSW, isOPFSSupported, isServiceWorkersSupported, openDownloadStream } from './download';
import { FileSaver } from './fileSaver';
import { fileSaverLogDebug } from './fileSaverLogger';

jest.mock('@proton/shared/lib/helpers/cookies', () => ({
    getCookie: jest.fn(),
}));

jest.mock('@proton/shared/lib/helpers/downloadFile', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../../utils/stream', () => ({
    streamToBuffer: jest.fn(),
}));

jest.mock('./download', () => ({
    initDownloadSW: jest.fn(),
    isServiceWorkersSupported: jest.fn(() => true),
    openDownloadStream: jest.fn(),
    isOPFSSupported: jest.fn(() => true),
}));

jest.mock('./fileSaverLogger.ts', () => ({
    fileSaverLogDebug: jest.fn(),
}));

const mockStorageEstimate = jest.fn();
const mockGetDirectory = jest.fn();
Object.defineProperty(global.navigator, 'storage', {
    value: {
        estimate: mockStorageEstimate,
        getDirectory: mockGetDirectory,
    },
    configurable: true,
});

const mockUnleashStore = {
    isEnabled: jest.fn().mockReturnValue(false),
    getVariant: jest.fn().mockReturnValue({
        enabled: false,
        name: 'base-memory',
    }),
};
featureFlagStore.getState().setClient(mockUnleashStore as unknown as UnleashClient);
const getCookieMock = jest.mocked(getCookie);
const isServiceWorkersSupportedMock = jest.mocked(isServiceWorkersSupported);
const isOPFSSupportedMock = jest.mocked(isOPFSSupported);
const openDownloadStreamMock = jest.mocked(openDownloadStream);
const initDownloadSWMock = jest.mocked(initDownloadSW);
const streamToBufferMock = jest.mocked(streamToBuffer);
const mockLog = jest.mocked(fileSaverLogDebug);
const MB = 1024 * 1024;

describe('FileSaver', () => {
    let fileSaver: FileSaver;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        fileSaver = new FileSaver();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    describe('selectMechanismForDownload', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            fileSaver = new FileSaver();

            getCookieMock.mockReturnValue(undefined);
            mockUnleashStore.isEnabled.mockReturnValue(false);
            mockUnleashStore.getVariant.mockReturnValue({
                enabled: false,
                name: 'base-memory',
            });
            isServiceWorkersSupportedMock.mockReturnValue(true);
            mockStorageEstimate.mockResolvedValue({
                quota: 0,
                usage: 0,
            });
        });

        describe('E2E mechanism selection', () => {
            it('should return "memory" when E2E cookie is set to memory', async () => {
                getCookieMock.mockReturnValue('memory');
                const result = await fileSaver.selectMechanismForDownload(1000);
                expect(result).toBe('memory');
                expect(getCookieMock).toHaveBeenCalledWith('DriveE2EDownloadMechanism');
            });

            it('should return "opfs" when E2E cookie is set to opfs', async () => {
                getCookieMock.mockReturnValue('opfs');
                const result = await fileSaver.selectMechanismForDownload(1000);
                expect(result).toBe('opfs');
            });

            it('should ignore invalid E2E cookie values', async () => {
                getCookieMock.mockReturnValue('invalid_mechanism');
                const result = await fileSaver.selectMechanismForDownload(100);
                expect(result).toBe('memory');
            });
        });

        describe('memory threshold logic', () => {
            it('should return "memory" for small files', async () => {
                const smallSize = 100 * 1024 * 1024;
                const result = await fileSaver.selectMechanismForDownload(smallSize);
                expect(result).toBe('memory');
            });

            it('should not return "memory" for large files', async () => {
                const largeSize = 1000 * 1024 * 1024;
                const result = await fileSaver.selectMechanismForDownload(largeSize);
                expect(result).toBe('sw');
            });
        });

        describe('OPFS mechanism selection', () => {
            beforeEach(() => {
                mockStorageEstimate.mockResolvedValue({
                    quota: 2000 * 1024 * 1024, // 2GB
                    usage: 100 * 1024 * 1024, // 100MB
                });
            });

            it('should return "opfs" when all conditions are met', async () => {
                const size = 500 * 1024 * 1024; // 500MB
                const result = await fileSaver.selectMechanismForDownload(size);
                expect(result).toBe('opfs');
            });

            it('should not return "opfs" when useSWFallback is true', async () => {
                fileSaver.useSWFallback = true;
                const size = 500 * 1024 * 1024;
                const result = await fileSaver.selectMechanismForDownload(size);
                expect(result).toBe('sw');
            });

            it('should not return "opfs" when storage is insufficient', async () => {
                mockStorageEstimate.mockResolvedValue({
                    quota: 1000 * 1024 * 1024, // 1GB
                    usage: 900 * 1024 * 1024, // 900MB
                });
                const size = 500 * 1024 * 1024;
                const result = await fileSaver.selectMechanismForDownload(size);
                expect(result).toBe('sw');
            });
        });

        describe('memory limits selection', () => {
            it('should use memory when file size is below MEMORY_DOWNLOAD_LIMIT', async () => {
                const size = MEMORY_DOWNLOAD_LIMIT - MB;
                const result = await fileSaver.selectMechanismForDownload(size);
                expect(result).toBe('memory');
            });

            it('should not use memory when file size is at or above MEMORY_DOWNLOAD_LIMIT', async () => {
                const size = MEMORY_DOWNLOAD_LIMIT + MB;
                const result = await fileSaver.selectMechanismForDownload(size);
                expect(result).toBe('sw');
            });
        });

        describe('fallback mechanisms', () => {
            it('should return "memory_fallback" when service workers are unsupported for big files', async () => {
                isServiceWorkersSupportedMock.mockReturnValue(false);
                const result = await fileSaver.selectMechanismForDownload(MB * 1000);
                expect(result).toBe('memory_fallback');
            });

            it('should return "sw" as final fallback for big files', async () => {
                const result = await fileSaver.selectMechanismForDownload(MB * 1000);
                expect(result).toBe('sw');
            });
        });
    });

    describe('saveAsFile', () => {
        const mockStream = new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array([1]));
                controller.close();
            },
        });
        const mockMeta = {
            filename: 'test.txt',
            mimeType: 'text/plain',
            size: 100 * MB,
            downloadId: 'download-1',
        };

        beforeEach(() => {
            jest.clearAllMocks();
            getCookieMock.mockReturnValue(undefined);
            streamToBufferMock.mockResolvedValue([new Uint8Array([1, 2, 3])]);
            openDownloadStreamMock.mockResolvedValue(new WritableStream());
            initDownloadSWMock.mockResolvedValue(undefined);
        });

        it('should use saveViaBuffer for memory mechanism', async () => {
            getCookieMock.mockReturnValue('memory');

            await fileSaver.saveAsFile(mockStream, mockMeta);

            expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('mechanism: memory'));
            expect(streamToBufferMock).toHaveBeenCalled();
        });

        it('should use saveViaBuffer for memory_fallback mechanism', async () => {
            getCookieMock.mockReturnValue(undefined);
            isServiceWorkersSupportedMock.mockReturnValue(false);
            const largeMeta = { ...mockMeta, size: 1000 * MB };

            await fileSaver.saveAsFile(mockStream, largeMeta);

            expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('mechanism: memory_fallback'));
            expect(streamToBufferMock).toHaveBeenCalled();
        });

        it('should use saveViaOPFS for opfs mechanism', async () => {
            // Mock the read stream
            const mockStreamReader = {
                read: jest
                    .fn()
                    .mockResolvedValueOnce({ done: false, value: new Uint8Array([1]) })
                    .mockResolvedValueOnce({ done: false, value: new Uint8Array([2]) })
                    .mockResolvedValueOnce({ done: true }),
                releaseLock: jest.fn(),
            };
            const mockWritable = {
                write: jest.fn().mockResolvedValue(undefined),
                close: jest.fn().mockResolvedValue(undefined),
            };

            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new Uint8Array([1, 2, 3]));
                    controller.close();
                },
            });
            (mockStream as any).getReader = () => mockStreamReader;

            getCookieMock.mockReturnValue('opfs');
            mockStorageEstimate.mockResolvedValue({
                quota: 2000 * MB,
                usage: 100 * MB,
            });

            const mockFile = new File([], 'test.txt');
            const mockFileHandle = {
                createWritable: jest.fn().mockResolvedValue(mockWritable),
                getFile: jest.fn().mockResolvedValue(mockFile),
            };
            const mockRoot = {
                getFileHandle: jest.fn().mockResolvedValue(mockFileHandle),
                removeEntry: jest.fn().mockResolvedValue(undefined),
            };
            mockGetDirectory.mockResolvedValue(mockRoot);

            await fileSaver.saveAsFile(mockStream, mockMeta);

            expect(mockLog).toHaveBeenCalledWith('Saving via OPFS');
            expect(mockGetDirectory).toHaveBeenCalled();
            expect(mockRoot.getFileHandle).toHaveBeenCalledWith('test.txt', { create: true });
            expect(mockFileHandle.createWritable).toHaveBeenCalled();
            expect(mockStreamReader.read).toHaveBeenCalled();
            expect(mockWritable.write).toHaveBeenCalled();
            expect(mockWritable.close).toHaveBeenCalled();
            expect(mockStreamReader.releaseLock).toHaveBeenCalled();
            expect(mockFileHandle.getFile).toHaveBeenCalled();
            expect(downloadFile).toHaveBeenCalledWith(mockFile, 'test.txt');
        });

        it('should use saveViaDownload for SW mechanism', async () => {
            initDownloadSWMock.mockResolvedValue(undefined);

            const mockAbortController = {
                signal: {
                    addEventListener: jest.fn(),
                },
                abort: jest.fn(),
            };
            global.AbortController = jest.fn().mockImplementation(() => mockAbortController);

            const mockSaveStream = new WritableStream();
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new Uint8Array([1, 2, 3]));
                    controller.close();
                },
            });
            (mockStream as any).pipeTo = jest.fn().mockResolvedValue(undefined);

            mockUnleashStore.isEnabled.mockReturnValue(false);
            isServiceWorkersSupportedMock.mockReturnValue(true);
            openDownloadStreamMock.mockResolvedValue(mockSaveStream);
            const largeMeta = { ...mockMeta, size: 1000 * MB };

            await fileSaver.saveAsFile(mockStream, largeMeta);

            // Verify the service worker path was taken
            expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('mechanism: sw'));
            expect(initDownloadSWMock).toHaveBeenCalled();
            expect(openDownloadStreamMock).toHaveBeenCalledWith(
                largeMeta,
                expect.objectContaining({ onCancel: expect.any(Function) })
            );
            expect(mockStream.pipeTo).toHaveBeenCalledWith(
                mockSaveStream,
                expect.objectContaining({ preventCancel: true })
            );
            expect(mockAbortController.signal.addEventListener).toHaveBeenCalledWith('abort', expect.any(Function));
        });

        it('should handle errors during save', async () => {
            streamToBufferMock.mockRejectedValue(new Error('Save failed'));

            await expect(fileSaver.saveAsFile(mockStream, mockMeta)).rejects.toThrow('Download failed');

            expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('failed'));
        });
    });

    describe('isFallbackLimitExceeded', () => {
        beforeEach(() => {
            isServiceWorkersSupportedMock.mockReturnValue(false);
            isOPFSSupportedMock.mockResolvedValue(false);
        });

        it('should return false when file size is within MEMORY_DOWNLOAD_LIMIT', async () => {
            await expect(fileSaver.wouldExceeedMemoryLImit(MEMORY_DOWNLOAD_LIMIT - MB)).resolves.toBe(false);
        });

        it('should return true when file exceeds MEMORY_DOWNLOAD_LIMIT with memory fallback', async () => {
            await expect(fileSaver.wouldExceeedMemoryLImit(MEMORY_DOWNLOAD_LIMIT + MB)).resolves.toBe(true);
        });

        it('should return false at exactly MEMORY_DOWNLOAD_LIMIT without memory fallback', async () => {
            await expect(fileSaver.wouldExceeedMemoryLImit(MEMORY_DOWNLOAD_LIMIT)).resolves.toBe(false);
        });
    });
});
