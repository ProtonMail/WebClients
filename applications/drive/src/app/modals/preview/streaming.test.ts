import { act, renderHook } from '@testing-library/react-hooks';

import type { DownloadController, ProtonDriveClient, SeekableReadableStream } from '@proton/drive/sdk';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { initDownloadSW } from '../../modules/fileSaver/download';
import { useVideoStreaming } from './streaming';

jest.mock('../../modules/fileSaver/download');
jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/sentry'),
    traceError: jest.fn(),
}));
const mockedInitDownloadSW = jest.mocked(initDownloadSW);

// Force the Service Worker path: MSE detection is irrelevant to this test, and stubbing it
// out avoids having to fabricate a byte-accurate fragmented-mp4 header just to sniff past it.
jest.mock('./mseStreaming', () => ({
    ...jest.requireActual('./mseStreaming'),
    isFragmentedMp4: jest.fn().mockReturnValue(false),
}));

function createFakeSeekableStream(): SeekableReadableStream {
    return Object.assign(new ReadableStream<Uint8Array<ArrayBuffer>>(), {
        seek: async () => {},
        read: async (): Promise<{ value: Uint8Array<ArrayBuffer>; done: boolean }> => ({
            value: new Uint8Array(0),
            done: true,
        }),
    });
}

function createFakeDrive(): Pick<ProtonDriveClient, 'getFileDownloader'> {
    return {
        getFileDownloader: async () => ({
            getClaimedSizeInBytes: () => undefined,
            getSeekableStream: () => createFakeSeekableStream(),
            downloadToStream: (): DownloadController => {
                throw new Error('not implemented in fake');
            },
            unsafeDownloadToStream: (): DownloadController => {
                throw new Error('not implemented in fake');
            },
        }),
    };
}

// Everything downstream of the fakes above resolves in a handful of microtask ticks
// (no real network/timer involved), so a small bounded poll is enough and never flaky-slow.
async function waitForUrl(getUrl: () => string | undefined, expected: string) {
    for (let attempt = 0; attempt < 20; attempt++) {
        if (getUrl() === expected) {
            return;
        }
        await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    }
    throw new Error(`Timed out waiting for url to become "${expected}", last seen "${getUrl()}"`);
}

describe('useVideoStreaming', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedInitDownloadSW.mockResolvedValue(undefined);

        Object.defineProperty(navigator, 'serviceWorker', {
            value: {
                ready: Promise.resolve(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
            },
            configurable: true,
        });
    });

    it('changes the Service Worker stream URL when nodeUid changes, so the <video> reloads', async () => {
        const drive = createFakeDrive();
        const { result, rerender, unmount } = renderHook(
            (props: { nodeUid: string }) => useVideoStreaming({ drive, mimeType: 'video/mp4', ...props }),
            { initialProps: { nodeUid: 'node-1' } }
        );

        await waitForUrl(() => result.current?.url, '/sw/stream/stream-id-for-node-1');
        const firstUrl = result.current?.url;

        rerender({ nodeUid: 'node-2' });

        await waitForUrl(() => result.current?.url, '/sw/stream/stream-id-for-node-2');
        const secondUrl = result.current?.url;

        expect(secondUrl).not.toBe(firstUrl);

        unmount();
    });

    it('reports playback errors with the mimeType and media error code as tags', async () => {
        jest.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
        const { result, unmount } = renderHook(() =>
            useVideoStreaming({ drive: createFakeDrive(), nodeUid: 'node-1', mimeType: 'video/mp4' })
        );
        await waitForUrl(() => result.current?.url, '/sw/stream/stream-id-for-node-1');

        act(() => {
            result.current?.onVideoPlaybackError({
                type: 'error',
                target: { error: { code: 4 } },
            });
        });

        expect(traceError).toHaveBeenCalledTimes(1);
        expect(traceError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ tags: { mimeType: 'video/mp4', mediaErrorCode: 4 } })
        );

        unmount();
    });

    it('does not report playback errors for containers the browser cannot decode', async () => {
        jest.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('');
        const { result, unmount } = renderHook(() =>
            useVideoStreaming({ drive: createFakeDrive(), nodeUid: 'node-1', mimeType: 'video/x-msvideo' })
        );
        await waitForUrl(() => result.current?.url, '/sw/stream/stream-id-for-node-1');

        act(() => {
            result.current?.onVideoPlaybackError({
                type: 'error',
                target: { error: { code: 4 } },
            });
        });

        expect(traceError).not.toHaveBeenCalled();

        unmount();
    });
});
