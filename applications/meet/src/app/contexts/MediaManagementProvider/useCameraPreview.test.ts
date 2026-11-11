import { renderHook } from '@testing-library/react';
import type { Room } from 'livekit-client';

import { useCameraPreview } from './useCameraPreview';

const livekitClient = vi.hoisted(() => ({
    Track: { Kind: { Video: 'video' }, Source: { Camera: 'camera' } },
    createLocalVideoTrack: vi.fn(),
}));
vi.mock('livekit-client', () => livekitClient);

vi.mock('@proton/shared/lib/helpers/browser', () => ({ isChrome: () => false, isMobile: () => false }));

vi.mock('@proton/shared/lib/helpers/promise', () => ({ wait: () => Promise.resolve() }));

const processorMocks = vi.hoisted(() => ({
    createBackgroundProcessor: vi.fn(),
    ensureBackgroundProcessor: vi.fn(),
}));
vi.mock('../../processors/background-processor/createBackgroundProcessor', () => processorMocks);

vi.mock('@proton/meet/utils/virtualBackgrounds', () => ({ getVirtualBackgroundSource: vi.fn() }));

const createTrack = () => ({
    attach: vi.fn(),
    detach: vi.fn(),
    stop: vi.fn(),
    stopProcessor: vi.fn().mockResolvedValue(undefined),
    getProcessor: vi.fn(() => undefined),
});

// The camera the meeting publishes, live or not.
const publishedCamera = (live: boolean) =>
    new Map([
        [
            'cam',
            {
                kind: 'video',
                source: 'camera',
                track: { isMuted: !live, mediaStreamTrack: { readyState: live ? 'live' : 'ended' } },
            },
        ],
    ]);

const setup = ({ withBlur = false, trackPublications = new Map() } = {}) => {
    const trackBackgroundEffectInitialization = vi.fn(() => 1);
    const hook = renderHook(() =>
        useCameraPreview({
            selectedCameraId: 'camera-1',
            facingMode: 'user',
            isBackgroundBlurSupported: withBlur,
            backgroundEffect: withBlur ? 'blur' : 'none',
            room: { localParticipant: { activeDeviceMap: new Map(), trackPublications } } as unknown as Room,
            trackBackgroundEffectInitialization,
            cancelBackgroundEffectInitialization: vi.fn(),
        })
    );
    return { ...hook, trackBackgroundEffectInitialization };
};

const startBlurredPreview = async (trackPublications = new Map()) => {
    const processor = {
        enable: vi.fn(),
        hasAppliedMask: vi.fn(() => false),
        waitUntilApplied: vi.fn(() => new Promise(() => {})),
    };
    livekitClient.createLocalVideoTrack.mockResolvedValue(createTrack());
    processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
    processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

    const { result, trackBackgroundEffectInitialization } = setup({ withBlur: true, trackPublications });
    await result.current.handlePreviewCameraToggle(document.createElement('video'));

    return trackBackgroundEffectInitialization;
};

describe('useCameraPreview', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should report the preview warmup before joining', async () => {
        const trackBackgroundEffectInitialization = await startBlurredPreview();

        expect(trackBackgroundEffectInitialization).toHaveBeenCalledWith('blur', expect.any(Function));
    });

    it('should leave the initializing state to the published camera while it is live', async () => {
        // The preview teardown on join would otherwise clear the state of the published warmup.
        const trackBackgroundEffectInitialization = await startBlurredPreview(publishedCamera(true));

        expect(trackBackgroundEffectInitialization).not.toHaveBeenCalled();
    });

    it('should report the preview warmup in a meeting while the camera is off', async () => {
        // The Backgrounds panel previews its own camera then, and nothing else warms up.
        const trackBackgroundEffectInitialization = await startBlurredPreview(publishedCamera(false));

        expect(trackBackgroundEffectInitialization).toHaveBeenCalledWith('blur', expect.any(Function));
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
