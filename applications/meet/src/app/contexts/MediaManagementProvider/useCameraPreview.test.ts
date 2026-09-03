import { renderHook } from '@testing-library/react';
import type { Room } from 'livekit-client';

import { useCameraPreview } from './useCameraPreview';

const livekitClient = vi.hoisted(() => ({
    createLocalVideoTrack: vi.fn(),
}));
vi.mock('livekit-client', () => livekitClient);

vi.mock('@proton/shared/lib/helpers/browser', () => ({ isChrome: () => false, isMobile: () => false }));

vi.mock('@proton/shared/lib/helpers/promise', () => ({ wait: () => Promise.resolve() }));

vi.mock('../../processors/background-processor/createBackgroundProcessor', () => ({
    createBackgroundProcessor: vi.fn(),
    createCustomBackgroundProcessor: vi.fn(),
    ensureBackgroundProcessor: vi.fn(),
}));

vi.mock('@proton/meet/utils/virtualBackgrounds', () => ({ getVirtualBackgroundSource: vi.fn() }));

const createTrack = () => ({
    attach: vi.fn(),
    detach: vi.fn(),
    stop: vi.fn(),
    stopProcessor: vi.fn().mockResolvedValue(undefined),
    getProcessor: vi.fn(() => undefined),
});

const setup = () =>
    renderHook(() =>
        useCameraPreview({
            selectedCameraId: 'camera-1',
            facingMode: 'user',
            isBackgroundBlurSupported: false,
            backgroundEffect: 'none',
            room: { localParticipant: { activeDeviceMap: new Map() } } as unknown as Room,
            trackBackgroundEffectInitialization: vi.fn(),
            cancelBackgroundEffectInitialization: vi.fn(),
        })
    );

describe('useCameraPreview', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should stop a camera track that is still being created when the preview is torn down', async () => {
        const track = createTrack();
        let resolveTrackCreation: () => void = () => {};
        livekitClient.createLocalVideoTrack.mockReturnValue(
            new Promise((resolve) => {
                resolveTrackCreation = () => resolve(track);
            })
        );

        const { result } = setup();

        const start = result.current.handlePreviewCameraToggle(document.createElement('video'));
        // The sidebar closes before the camera has handed us a track.
        const stop = result.current.cleanupPreviewTrack();

        resolveTrackCreation();

        await start;
        await stop;

        // Without serialising the teardown, the camera would stay on for the rest of the meeting.
        expect(track.stop).toHaveBeenCalled();
    });

    it('should stop a camera track that is still being created when the preview is released', async () => {
        const track = createTrack();
        let resolveTrackCreation: () => void = () => {};
        livekitClient.createLocalVideoTrack.mockReturnValue(
            new Promise((resolve) => {
                resolveTrackCreation = () => resolve(track);
            })
        );

        const { result } = setup();

        const start = result.current.handlePreviewCameraToggle(document.createElement('video'));
        const release = result.current.cleanupCameraPreview();

        resolveTrackCreation();

        await start;
        await release;

        expect(track.stop).toHaveBeenCalled();
    });

    it('should keep tearing down the preview after a failed start', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        livekitClient.createLocalVideoTrack.mockRejectedValue(new Error('no camera'));

        const { result } = setup();

        await result.current.handlePreviewCameraToggle(document.createElement('video'));

        const track = createTrack();
        livekitClient.createLocalVideoTrack.mockResolvedValue(track);

        await result.current.handlePreviewCameraToggle(document.createElement('video'));
        await result.current.cleanupPreviewTrack();

        expect(track.stop).toHaveBeenCalled();
    });
});
