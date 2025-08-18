import { act, renderHook } from '@testing-library/react-hooks';

import { isVideo } from '@proton/shared/lib/helpers/mimetype';

import { initDownloadSW } from '../../store/_downloads/fileSaver/download';
import { sendErrorReport } from '../../utils/errorHandling';
import { useVideoStreaming } from './useVideoStreaming';

jest.mock('@proton/shared/lib/helpers/mimetype');
const mockedIsVideo = jest.mocked(isVideo);

jest.mock('../../store/_downloads/fileSaver/download');
const mockedInitDownloadSW = jest.mocked(initDownloadSW);

jest.mock('../../utils/errorHandling');
const mockedSendErrorReport = jest.mocked(sendErrorReport);

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-123'),
}));

jest.useFakeTimers();

describe('useVideoStreaming', () => {
    const mockVideoData = { blockSizes: [1024, 2048, 1536] };
    const mockMimeType = 'video/mp4';
    const mockDownloadSlice = jest.fn();
    const mockServiceWorkerController = { postMessage: jest.fn() };
    let mockServiceWorkerReady = Promise.resolve();

    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();

        Object.defineProperty(navigator, 'serviceWorker', {
            value: {
                ready: mockServiceWorkerReady,
                controller: mockServiceWorkerController,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
            },
            writable: true,
        });

        mockedIsVideo.mockReturnValue(true);
        mockServiceWorkerReady = Promise.resolve();
        mockDownloadSlice.mockResolvedValue([new Uint8Array([1, 2, 3])]);
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.useFakeTimers();
    });

    it('should return undefined when required conditions are not met', () => {
        const originalNavigator = global.navigator;
        Object.defineProperty(global, 'navigator', {
            value: {},
            configurable: true,
            writable: true,
        });

        expect(
            renderHook(() =>
                useVideoStreaming({
                    mimeType: mockMimeType,
                    videoData: mockVideoData,
                    downloadSlice: mockDownloadSlice,
                })
            ).result.current
        ).toBeUndefined();

        Object.defineProperty(global, 'navigator', {
            value: originalNavigator,
            configurable: true,
            writable: true,
        });
    });

    it('should return streaming URL when all conditions are met', () => {
        const { result } = renderHook(() =>
            useVideoStreaming({
                mimeType: mockMimeType,
                videoData: mockVideoData,
                downloadSlice: mockDownloadSlice,
            })
        );

        expect(result.current).toEqual({
            url: '/sw/video/test-uuid-123',
            onVideoPlaybackError: expect.any(Function),
        });
        expect(mockedInitDownloadSW).toHaveBeenCalled();
    });

    it('should handle service worker timeout', () => {
        const { result } = renderHook(() =>
            useVideoStreaming({
                mimeType: mockMimeType,
                videoData: mockVideoData,
                downloadSlice: mockDownloadSlice,
            })
        );

        act(() => {
            jest.advanceTimersByTime(15000);
        });

        expect(mockedSendErrorReport).toHaveBeenCalledWith(
            new Error('Service Worker timeout: not ready within 15 seconds')
        );
        expect(result.current).toBeUndefined();
    });

    it('should handle message events and block data requests', async () => {
        const addEventListenerSpy = jest.fn();
        Object.defineProperty(navigator, 'serviceWorker', {
            value: {
                ready: mockServiceWorkerReady,
                controller: mockServiceWorkerController,
                addEventListener: addEventListenerSpy,
                removeEventListener: jest.fn(),
            },
            writable: true,
        });

        renderHook(() =>
            useVideoStreaming({
                mimeType: mockMimeType,
                videoData: mockVideoData,
                downloadSlice: mockDownloadSlice,
            })
        );

        const messageHandler = addEventListenerSpy.mock.calls.find((call) => call[0] === 'message')?.[1];
        const mockEvent = {
            data: { type: 'get_block_data', indices: [0, 1] },
            ports: [{ postMessage: jest.fn() }],
        };

        await act(async () => {
            await messageHandler(mockEvent);
        });

        expect(mockDownloadSlice).toHaveBeenCalledWith(expect.any(AbortSignal), [0, 1]);
    });

    it('should handle download errors', async () => {
        const testError = new Error('Download failed');
        mockDownloadSlice.mockRejectedValue(testError);

        const addEventListenerSpy = jest.fn();
        Object.defineProperty(navigator, 'serviceWorker', {
            value: {
                ready: mockServiceWorkerReady,
                controller: mockServiceWorkerController,
                addEventListener: addEventListenerSpy,
                removeEventListener: jest.fn(),
            },
            writable: true,
        });

        const { result } = renderHook(() =>
            useVideoStreaming({
                mimeType: mockMimeType,
                videoData: mockVideoData,
                downloadSlice: mockDownloadSlice,
            })
        );

        const messageHandler = addEventListenerSpy.mock.calls.find((call) => call[0] === 'message')?.[1];
        const mockEvent = {
            data: { type: 'get_block_data', indices: [0] },
            ports: [{ postMessage: jest.fn() }],
        };

        await act(async () => {
            await messageHandler(mockEvent);
        });

        expect(mockedSendErrorReport).toHaveBeenCalledWith(testError);
        expect(result.current).toBeUndefined();
    });

    it('should handle video playback errors', () => {
        const { result } = renderHook(() =>
            useVideoStreaming({
                mimeType: mockMimeType,
                videoData: mockVideoData,
                downloadSlice: mockDownloadSlice,
            })
        );

        const testError = new Error('Playback error');

        act(() => {
            result.current?.onVideoPlaybackError(testError);
        });

        expect(mockedSendErrorReport).toHaveBeenCalledWith(testError);
        expect(result.current).toBeUndefined();
    });

    it('should prevent re-setup when video is broken', () => {
        const { result, rerender } = renderHook((props) => useVideoStreaming(props), {
            initialProps: {
                mimeType: mockMimeType,
                videoData: mockVideoData,
                downloadSlice: mockDownloadSlice,
            },
        });

        act(() => {
            result.current?.onVideoPlaybackError(new Error('Test error'));
        });

        jest.clearAllMocks();
        rerender({
            mimeType: mockMimeType,
            videoData: mockVideoData,
            downloadSlice: mockDownloadSlice,
        });

        expect(mockServiceWorkerController.postMessage).not.toHaveBeenCalled();
    });
});
