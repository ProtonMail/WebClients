import { act, renderHook } from '@testing-library/react';

import { sendErrorReport } from '@proton/drive/legacy/errorHandling';
import metrics from '@proton/metrics/metricsInstance';
import { isVideo } from '@proton/shared/lib/helpers/mimetype';

import { initDownloadSW } from '../../../modules/fileSaver/download';
import { useVideoStreaming } from './useVideoStreaming';

vi.mock('@proton/shared/lib/helpers/mimetype');
const mockedIsVideo = vi.mocked(isVideo);

vi.mock('../../../modules/fileSaver/download');
const mockedInitDownloadSW = vi.mocked(initDownloadSW);

vi.mock('@proton/drive/legacy/errorHandling');
const mockedSendErrorReport = vi.mocked(sendErrorReport);

vi.mock('uuid', () => ({
    v4: vi.fn(() => 'test-uuid-123'),
}));

vi.mock('@proton/metrics/metricsInstance', () => ({
    default: {
        drive_warnings_total: {
            increment: vi.fn(),
        },
    },
}));

vi.useFakeTimers();

describe('useVideoStreaming', () => {
    const mockVideoData = { blockSizes: [1024, 2048, 1536] };
    const mockMimeType = 'video/mp4';
    const mockDownloadSlice = vi.fn();
    const mockServiceWorkerController = { postMessage: vi.fn() };
    let mockServiceWorkerReady = Promise.resolve();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.clearAllTimers();

        Object.defineProperty(navigator, 'serviceWorker', {
            value: {
                ready: mockServiceWorkerReady,
                controller: mockServiceWorkerController,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
            writable: true,
        });

        mockedIsVideo.mockReturnValue(true);
        mockServiceWorkerReady = Promise.resolve();
        mockDownloadSlice.mockResolvedValue([new Uint8Array([1, 2, 3])]);
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.useFakeTimers();
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
            vi.advanceTimersByTime(15000);
        });

        expect(mockedSendErrorReport).not.toHaveBeenCalled();
        expect(metrics.drive_warnings_total.increment).toHaveBeenCalledWith({ warning: 'cannot_init_sw' });
        expect(result.current).toBeUndefined();
    });

    it('should handle message events and block data requests', async () => {
        const addEventListenerSpy = vi.fn();
        Object.defineProperty(navigator, 'serviceWorker', {
            value: {
                ready: mockServiceWorkerReady,
                controller: mockServiceWorkerController,
                addEventListener: addEventListenerSpy,
                removeEventListener: vi.fn(),
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
            ports: [{ postMessage: vi.fn() }],
        };

        await act(async () => {
            await messageHandler(mockEvent);
        });

        expect(mockDownloadSlice).toHaveBeenCalledWith(expect.any(AbortSignal), [0, 1]);
    });

    it('should handle download errors', async () => {
        const testError = new Error('Download failed');
        mockDownloadSlice.mockRejectedValue(testError);

        const addEventListenerSpy = vi.fn();
        Object.defineProperty(navigator, 'serviceWorker', {
            value: {
                ready: mockServiceWorkerReady,
                controller: mockServiceWorkerController,
                addEventListener: addEventListenerSpy,
                removeEventListener: vi.fn(),
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
            ports: [{ postMessage: vi.fn() }],
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

        vi.clearAllMocks();
        rerender({
            mimeType: mockMimeType,
            videoData: mockVideoData,
            downloadSlice: mockDownloadSlice,
        });

        expect(mockServiceWorkerController.postMessage).not.toHaveBeenCalled();
    });
});
