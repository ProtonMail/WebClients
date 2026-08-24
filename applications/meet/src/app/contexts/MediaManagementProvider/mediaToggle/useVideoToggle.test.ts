import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { selectSelectedCameraId } from '@proton/meet/store/slices/deviceManagementSlice/selectors';

import { getVirtualBackgroundSource } from '../../../utils/virtualBackgrounds/virtualBackgrounds';
import { useVideoToggle } from './useVideoToggle';

vi.mock('livekit-client', () => ({
    ConnectionState: { Connected: 'connected', Disconnected: 'disconnected' },
    RoomEvent: { LocalTrackPublished: 'localTrackPublished' },
    Track: {
        Kind: { Video: 'video', Audio: 'audio' },
        Source: { Camera: 'camera', ScreenShare: 'screen_share' },
    },
}));

const livekitReact = vi.hoisted(() => ({
    useLocalParticipant: vi.fn(),
    useRoomContext: vi.fn(),
}));
vi.mock('@livekit/components-react', () => livekitReact);

vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => ({ reportMeetError: vi.fn() }),
}));

const storeMocks = vi.hoisted(() => ({
    useMeetDispatch: () => vi.fn(),
    useMeetSelector: vi.fn((_selector: unknown): unknown => undefined),
    useMeetStore: () => ({ getState: () => ({}) }),
}));
vi.mock('@proton/meet/store/hooks', () => storeMocks);

vi.mock('@proton/shared/lib/helpers/browser', () => ({ isMobile: () => false }));

const unleashMocks = vi.hoisted(() => ({ useFlag: vi.fn(() => true) }));
vi.mock('@proton/unleash/useFlag', () => unleashMocks);

const processorMocks = vi.hoisted(() => ({
    createBackgroundProcessor: vi.fn((): unknown => null),
    createCustomBackgroundProcessor: vi.fn(),
    ensureBackgroundProcessor: vi.fn(),
    supportsBackgroundEffects: vi.fn(() => true),
}));
vi.mock('../../../processors/background-processor/createBackgroundProcessor', () => processorMocks);

vi.mock('../../../utils/virtualBackgrounds/backgroundBlurPersistance', () => ({
    getPersistedBackgroundBlur: () => false,
    persistBackgroundBlur: vi.fn(),
}));

const virtualBackgroundPersistenceMocks = vi.hoisted(() => ({
    getPersistedVirtualBackground: vi.fn((): unknown => null),
    persistVirtualBackground: vi.fn(),
}));
vi.mock('../../../utils/virtualBackgrounds/virtualBackgroundPersistance', () => virtualBackgroundPersistenceMocks);

const dummyMocks = vi.hoisted(() => ({
    isDummyVideoTrack: vi.fn(),
    markVideoTrackDeviceBacked: vi.fn(),
}));
vi.mock('../../../utils/dummyVideoTrack', () => dummyMocks);

const setup = (isDummy: boolean, selectedCameraId?: string, cameraState: 'live' | 'off' = 'live') => {
    storeMocks.useMeetSelector.mockImplementation((selector: unknown) =>
        selector === selectSelectedCameraId ? selectedCameraId : undefined
    );

    // Records every write to the raw source's `enabled`, so tests can tell whether the camera
    // was blanked (which is only acceptable while a processor is swapped onto the track).
    const rawFrameToggles: boolean[] = [];
    let isRawFrameEnabled = true;

    // A camera that is off leaves behind a muted track whose source has been stopped
    let isCameraOff = cameraState === 'off';
    const setCameraOff = (value: boolean) => {
        isCameraOff = value;
    };

    const track = {
        stopProcessor: vi.fn().mockResolvedValue(undefined),
        restartTrack: vi.fn().mockResolvedValue(undefined),
        unmute: vi.fn().mockResolvedValue(undefined),
        getProcessor: vi.fn(),
        setProcessor: vi.fn().mockResolvedValue(undefined),
        get isMuted() {
            return isCameraOff;
        },
        mediaStreamTrack: {
            get readyState() {
                return isCameraOff ? 'ended' : 'live';
            },
            get enabled() {
                return isRawFrameEnabled;
            },
            set enabled(value: boolean) {
                isRawFrameEnabled = value;
                rawFrameToggles.push(value);
            },
        },
    };

    const localParticipant = {
        trackPublications: new Map([['cam', { kind: 'video', source: 'camera', track }]]),
        setCameraEnabled: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        off: vi.fn(),
    };
    const room = { localParticipant, state: 'connected', on: vi.fn(), off: vi.fn() };

    livekitReact.useRoomContext.mockReturnValue(room);
    livekitReact.useLocalParticipant.mockReturnValue({ isCameraEnabled: false, localParticipant });
    dummyMocks.isDummyVideoTrack.mockReturnValue(isDummy);

    const switchActiveDevice = vi.fn().mockResolvedValue(undefined);
    const trackBackgroundEffectInitialization = vi.fn();
    const reportBackgroundEffectFailure = vi.fn();
    const { result } = renderHook(() =>
        useVideoToggle({
            switchActiveDevice,
            backgroundProcessorVersion: 'current',
            trackBackgroundEffectInitialization,
            cancelBackgroundEffectInitialization: vi.fn(),
            reportBackgroundEffectFailure,
        })
    );

    return {
        result,
        track,
        localParticipant,
        rawFrameToggles,
        trackBackgroundEffectInitialization,
        reportBackgroundEffectFailure,
        setCameraOff,
    };
};

describe('useVideoToggle — placeholder track swap', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('swaps the placeholder for the real camera in place when enabling from a dummy track', async () => {
        const { result, track, localParticipant } = setup(true);

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: true, videoDeviceId: 'device-1', updateUserIntent: false });
        });

        expect(track.restartTrack).toHaveBeenCalledWith({ deviceId: { exact: 'device-1' } });
        expect(track.unmute).toHaveBeenCalled();
        expect(dummyMocks.markVideoTrackDeviceBacked).toHaveBeenCalledWith(track);
        expect(localParticipant.setCameraEnabled).not.toHaveBeenCalled();
    });

    it('restarts to the selected camera, not the passed deviceId', async () => {
        const { result, track } = setup(true, 'device-2');

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: true, videoDeviceId: 'device-1', updateUserIntent: false });
        });

        expect(track.restartTrack).toHaveBeenCalledWith({ deviceId: { exact: 'device-2' } });
    });

    it('uses setCameraEnabled for a real (non-dummy) camera track', async () => {
        const { result, track, localParticipant } = setup(false);

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: true, videoDeviceId: 'device-1', updateUserIntent: false });
        });

        expect(localParticipant.setCameraEnabled).toHaveBeenCalledWith(true, { deviceId: { exact: 'device-1' } });
        expect(track.restartTrack).not.toHaveBeenCalled();
        expect(dummyMocks.markVideoTrackDeviceBacked).not.toHaveBeenCalled();
    });
});

describe('useVideoToggle — background effects', () => {
    const createCustomProcessor = () => ({
        enable: vi.fn(),
        disable: vi.fn(),
        isEnabled: vi.fn(() => true),
        setBackground: vi.fn().mockResolvedValue(undefined),
        waitUntilBackgroundApplied: vi.fn().mockResolvedValue(undefined),
    });

    const createBlurProcessor = () => ({
        enable: vi.fn(),
        disable: vi.fn(),
        isEnabled: vi.fn(() => true),
        destroy: vi.fn().mockResolvedValue(undefined),
        waitUntilBlurApplied: vi.fn().mockResolvedValue(undefined),
    });

    afterEach(() => {
        vi.clearAllMocks();
        processorMocks.createBackgroundProcessor.mockReturnValue(null);
        processorMocks.supportsBackgroundEffects.mockReturnValue(true);
        virtualBackgroundPersistenceMocks.getPersistedVirtualBackground.mockReturnValue(null);
        unleashMocks.useFlag.mockReturnValue(true);
    });

    it('reports blur as supported while the processor is still loading', () => {
        // A promise that never settles: the implementation is still being fetched.
        processorMocks.createBackgroundProcessor.mockReturnValue(new Promise(() => {}));

        const { result } = setup(false);

        // Support is a browser capability, so it must not wait on the download. Reporting it as
        // unsupported here leaves the prejoin preview unprocessed with no later render to fix it.
        expect(result.current.isBackgroundBlurSupported).toBe(true);
    });

    it('applies blur picked before the processor finished loading', async () => {
        const blurProcessor = createBlurProcessor();
        let finishLoading: () => void = () => {};
        processorMocks.createBackgroundProcessor.mockReturnValue(
            new Promise((resolve) => {
                finishLoading = () => resolve(blurProcessor);
            })
        );
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result } = setup(false);

        await act(async () => {
            const pick = result.current.selectBackgroundEffect('blur');
            finishLoading();
            await pick;
        });

        expect(result.current.backgroundBlur).toBe(true);
        expect(blurProcessor.enable).toHaveBeenCalled();
    });

    it('reports blur as unsupported when the browser cannot run processors', () => {
        processorMocks.supportsBackgroundEffects.mockReturnValue(false);

        const { result } = setup(false);

        expect(result.current.isBackgroundBlurSupported).toBe(false);
    });

    it('applies the full-size image of the picked background to the camera track', async () => {
        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result } = setup(false);

        await act(async () => {
            await result.current.selectBackgroundEffect('office');
        });

        const source = processorMocks.createCustomBackgroundProcessor.mock.calls[0][0] as { imageUrl?: string };

        expect(source.imageUrl).toContain('01-modern-office');
        // The full-size image and its thumbnail share a basename, so the directory is what
        // tells them apart: the picker's thumbnail must never reach the processor.
        expect(source.imageUrl).not.toContain('thumbnails');
        expect(customProcessor.enable).toHaveBeenCalled();
        expect(result.current.virtualBackgroundId).toBe('office');
    });

    it('reports a virtual background, not blur, as the effect being initialized', async () => {
        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result, trackBackgroundEffectInitialization } = setup(false);

        await act(async () => {
            await result.current.selectBackgroundEffect('office');
        });

        expect(trackBackgroundEffectInitialization).toHaveBeenCalledWith('virtualBackground', expect.any(Function));
    });

    it('applies the last pick when backgrounds are clicked in quick succession', async () => {
        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result } = setup(false);

        await act(async () => {
            const first = result.current.selectBackgroundEffect('proton');
            const second = result.current.selectBackgroundEffect('office');

            await Promise.all([first, second]);
        });

        expect(customProcessor.setBackground).toHaveBeenLastCalledWith(getVirtualBackgroundSource('office'));
        expect(result.current.virtualBackgroundId).toBe('office');
        expect(result.current.pendingBackgroundEffect).toBeNull();
    });

    it('swaps the image on the running processor instead of building a new one', async () => {
        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result, track, rawFrameToggles } = setup(false);

        // Nothing is on the track yet, so the first pick has to swap the processor in.
        track.getProcessor.mockReturnValue(undefined);

        await act(async () => {
            await result.current.selectBackgroundEffect('proton');
        });

        expect(rawFrameToggles).toEqual([false, true]);

        // The processor now stays on the track, so switching images must reuse it.
        track.getProcessor.mockReturnValue(customProcessor);

        await act(async () => {
            await result.current.selectBackgroundEffect('mountain');
        });

        expect(processorMocks.createCustomBackgroundProcessor).toHaveBeenCalledTimes(1);
        expect(customProcessor.setBackground).toHaveBeenLastCalledWith(getVirtualBackgroundSource('mountain'));
        expect(track.stopProcessor).not.toHaveBeenCalled();
        // Blanking the camera is only needed while swapping, so an image change must not flicker.
        expect(rawFrameToggles).toEqual([false, true]);
    });

    it('clears the virtual background when picking no effect', async () => {
        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result } = setup(false);

        await act(async () => {
            await result.current.selectBackgroundEffect('coffee');
        });
        await act(async () => {
            await result.current.selectBackgroundEffect('none');
        });

        expect(customProcessor.disable).toHaveBeenCalled();
        expect(result.current.virtualBackgroundId).toBeNull();
        expect(result.current.backgroundBlur).toBe(false);
    });

    it('turns blur on without processing anything while the camera is off', async () => {
        const blurProcessor = createBlurProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(blurProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result } = setup(false, undefined, 'off');

        // Let the blur processor finish loading
        await act(async () => {});

        await act(async () => {
            await result.current.selectBackgroundEffect('blur');
        });

        expect(result.current.backgroundBlur).toBe(true);
        // Nothing may be attached or started: there is no frame to process yet
        expect(processorMocks.ensureBackgroundProcessor).not.toHaveBeenCalled();
        expect(blurProcessor.enable).not.toHaveBeenCalled();
    });

    it('replaces the virtual background with blur picked while the camera was off, once it is on', async () => {
        const blurProcessor = createBlurProcessor();
        const customProcessor = createCustomProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(blurProcessor);
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result, setCameraOff } = setup(false);

        await act(async () => {});

        await act(async () => {
            await result.current.selectBackgroundEffect('proton');
        });

        expect(customProcessor.enable).toHaveBeenCalled();

        setCameraOff(true);

        await act(async () => {
            await result.current.selectBackgroundEffect('blur');
        });

        // The toggle reflects the pick even though the camera cannot show it yet
        expect(result.current.backgroundBlur).toBe(true);
        expect(result.current.virtualBackgroundId).toBeNull();
        expect(blurProcessor.enable).not.toHaveBeenCalled();

        // The virtual background is dropped right away, so it cannot come back with the camera
        expect(customProcessor.disable).toHaveBeenCalled();

        setCameraOff(false);

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: true, videoDeviceId: 'device-1', updateUserIntent: false });
        });

        // Attaching is what puts blur on the track: setProcessor re-enables the processor it inits
        expect(processorMocks.ensureBackgroundProcessor).toHaveBeenLastCalledWith(expect.anything(), blurProcessor);
    });

    it('does not attach blur to the stopped track left behind when the camera is turned off', async () => {
        const blurProcessor = createBlurProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(blurProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result, trackBackgroundEffectInitialization, setCameraOff } = setup(false);

        // Let the blur processor finish loading
        await act(async () => {});

        await act(async () => {
            await result.current.selectBackgroundEffect('blur');
        });

        processorMocks.ensureBackgroundProcessor.mockClear();
        trackBackgroundEffectInitialization.mockClear();

        setCameraOff(true);

        await act(async () => {
            await result.current.toggleVideo({ isEnabled: false, videoDeviceId: 'device-1', updateUserIntent: false });
        });

        // A processor on a stopped track never sees a frame, so reporting it as initializing would
        // leave the spinner up forever.
        expect(processorMocks.ensureBackgroundProcessor).not.toHaveBeenCalled();
        expect(trackBackgroundEffectInitialization).not.toHaveBeenCalled();
    });

    it('re-applies a background that failed to attach when it is picked again', async () => {
        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        // No processor could be attached to the track on the first attempt.
        processorMocks.ensureBackgroundProcessor.mockResolvedValueOnce(null);

        const { result } = setup(false);

        await act(async () => {
            await result.current.selectBackgroundEffect('proton');
        });

        expect(customProcessor.enable).not.toHaveBeenCalled();

        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        await act(async () => {
            await result.current.selectBackgroundEffect('proton');
        });

        expect(customProcessor.enable).toHaveBeenCalled();
    });

    it('stops reporting the previous effect once the next one fails to attach', async () => {
        const blurProcessor = createBlurProcessor();
        const customProcessor = createCustomProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(blurProcessor);
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result, reportBackgroundEffectFailure } = setup(false);

        // Let the blur processor finish loading
        await act(async () => {});

        await act(async () => {
            await result.current.selectBackgroundEffect('blur');
        });

        expect(result.current.backgroundBlur).toBe(true);

        // A swap that fails can leave the track carrying no processor at all.
        processorMocks.ensureBackgroundProcessor.mockResolvedValueOnce(null);

        await act(async () => {
            await result.current.selectBackgroundEffect('mountain');
        });

        // Blur is gone from the track, so continuing to report it would show the camera as
        // blurred while the raw frames are published to the whole meeting.
        expect(blurProcessor.disable).toHaveBeenCalled();
        expect(result.current.backgroundBlur).toBe(false);
        expect(result.current.virtualBackgroundId).toBeNull();
        expect(result.current.appliedBackgroundEffect).toBe('none');
        expect(reportBackgroundEffectFailure).toHaveBeenCalledWith('virtualBackground');
    });

    it('keeps the pick when an attach is skipped because another one is already running', async () => {
        const blurProcessor = createBlurProcessor();
        const customProcessor = createCustomProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(blurProcessor);
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result, reportBackgroundEffectFailure } = setup(false);

        // Let the blur processor finish loading
        await act(async () => {});

        await act(async () => {
            await result.current.selectBackgroundEffect('blur');
        });

        // Hold the blur attach open so the next pick runs into the in-progress guard.
        let releaseBlurAttach: () => void = () => {};
        const blurAttachStarted = new Promise<void>((onStarted) => {
            processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => {
                if (processor !== blurProcessor) {
                    return processor;
                }

                onStarted();

                return new Promise((resolve) => {
                    releaseBlurAttach = () => resolve(processor);
                });
            });
        });

        await act(async () => {
            const toggling = result.current.toggleVideo({
                isEnabled: true,
                videoDeviceId: 'device-1',
                updateUserIntent: false,
            });

            await blurAttachStarted;

            await result.current.selectBackgroundEffect('mountain');

            releaseBlurAttach();

            await toggling;
        });

        // The attach was only deferred, so treating it as a failure would drop the user's pick and
        // claim the effect could not be initialized.
        expect(result.current.virtualBackgroundId).toBe('mountain');
        expect(result.current.backgroundBlur).toBe(false);
        expect(reportBackgroundEffectFailure).not.toHaveBeenCalled();
    });

    it('ignores a persisted virtual background once the feature is turned off', async () => {
        unleashMocks.useFlag.mockReturnValue(false);
        virtualBackgroundPersistenceMocks.getPersistedVirtualBackground.mockReturnValue('proton');

        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result } = setup(false);

        await act(async () => {});

        // Nothing is built or applied for it, so a rollback cannot strand the user with a
        // background they no longer have any way to change.
        expect(processorMocks.createCustomBackgroundProcessor).not.toHaveBeenCalled();
        expect(result.current.virtualBackgroundId).toBeNull();
        expect(result.current.appliedBackgroundEffect).toBe('none');

        await act(async () => {
            await result.current.selectBackgroundEffect('office');
        });

        expect(processorMocks.createCustomBackgroundProcessor).not.toHaveBeenCalled();
        expect(result.current.virtualBackgroundId).toBeNull();
    });
});
