import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BackgroundEffect, BackgroundState } from '@proton/meet/store/slices/backgroundSlice';
import { backgroundReducer, initialState } from '@proton/meet/store/slices/backgroundSlice';
import { deviceManagementReducer } from '@proton/meet/store/slices/deviceManagementSlice';
import { meetUserReducer } from '@proton/meet/store/slices/userSlice';
import { getVirtualBackgroundSource } from '@proton/meet/utils/virtualBackgrounds';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { useBackgroundEffects } from './useBackgroundEffects';

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

const unleashMocks = vi.hoisted(() => ({ useFlag: vi.fn(() => true) }));
vi.mock('@proton/unleash/useFlag', () => unleashMocks);

const backgroundSourceMocks = vi.hoisted(() => ({
    resolveBackgroundSource: vi.fn(),
}));
vi.mock('@proton/meet/utils/customBackgrounds', async (importOriginal) => ({
    ...(await importOriginal()),
    ...backgroundSourceMocks,
}));

const processorMocks = vi.hoisted(() => ({
    createBackgroundProcessor: vi.fn((): unknown => null),
    ensureBackgroundProcessor: vi.fn(),
}));
vi.mock('../../processors/background-processor/createBackgroundProcessor', () => processorMocks);

const imageMode = (id: 'protonDark' | 'office' | 'mountain' | 'library' | 'beach') => ({
    type: 'image',
    ...getVirtualBackgroundSource(id),
});

interface SetupOptions {
    cameraState?: 'live' | 'off';
    // The effect restored from a previous session, which the store carries before the first render.
    appliedBackgroundEffect?: BackgroundEffect;
}

const setup = ({ cameraState = 'live', appliedBackgroundEffect = 'none' }: SetupOptions = {}) => {
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
        on: vi.fn(),
        off: vi.fn(),
    };
    const room = { localParticipant, state: 'connected', on: vi.fn(), off: vi.fn() };

    livekitReact.useRoomContext.mockReturnValue(room);
    livekitReact.useLocalParticipant.mockReturnValue({ localParticipant });

    const store = configureStore({
        // The persist thunk reads the background namespace out of the user slice.
        reducer: { ...backgroundReducer, ...deviceManagementReducer, ...meetUserReducer },
        preloadedState: { background: { ...initialState, appliedBackgroundEffect } },
    });

    const getBackgroundState = () => (store.getState() as { background: BackgroundState }).background;
    const getAppliedBackgroundEffect = () => getBackgroundState().appliedBackgroundEffect;

    const { result } = renderHook(() => useBackgroundEffects({ isBackgroundEffectsSupported: true }), {
        wrapper: ({ children }) => (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        ),
    });

    return { result, track, rawFrameToggles, setCameraOff, getBackgroundState, getAppliedBackgroundEffect };
};

describe('useBackgroundEffects', () => {
    // Every effect is a mode of this one processor.
    const createProcessor = () => ({
        enable: vi.fn(),
        disable: vi.fn(),
        isEnabled: vi.fn(() => true),
        destroy: vi.fn().mockResolvedValue(undefined),
        setMode: vi.fn().mockResolvedValue(undefined),
        // Whether a mask is already on screen.
        hasAppliedMask: vi.fn(() => false),
        waitUntilApplied: vi.fn().mockResolvedValue(undefined),
    });

    beforeEach(() => {
        backgroundSourceMocks.resolveBackgroundSource.mockImplementation(async (effect: BackgroundEffect) =>
            getVirtualBackgroundSource(effect as Parameters<typeof getVirtualBackgroundSource>[0])
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
        processorMocks.createBackgroundProcessor.mockReturnValue(null);
        unleashMocks.useFlag.mockReturnValue(true);
        localStorage.clear();
    });

    it('applies blur picked before the processor finished loading', async () => {
        const processor = createProcessor();
        let finishLoading: () => void = () => {};
        processorMocks.createBackgroundProcessor.mockReturnValue(
            new Promise((resolve) => {
                finishLoading = () => resolve(processor);
            })
        );
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getAppliedBackgroundEffect, result } = setup();

        await act(async () => {
            const pick = result.current.selectBackgroundEffect('blur');
            finishLoading();
            await pick;
        });

        expect(getAppliedBackgroundEffect()).toBe('blur');
        expect(processor.setMode).toHaveBeenCalledWith({ type: 'blur' });
        expect(processor.enable).toHaveBeenCalled();
    });

    it('applies the full-size image of the picked background to the camera track', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getAppliedBackgroundEffect, result } = setup();

        await act(async () => {
            await result.current.selectBackgroundEffect('office');
        });

        const [mode] = processor.setMode.mock.calls[0] as [{ imageUrl?: string }];

        expect(mode.imageUrl).toContain('03-blurred-office');
        // The full-size image and its thumbnail share a basename, so the directory is what
        // tells them apart: the picker's thumbnail must never reach the processor.
        expect(mode.imageUrl).not.toContain('thumbnails');
        expect(processor.enable).toHaveBeenCalled();
        expect(getAppliedBackgroundEffect()).toBe('office');
    });

    it('does not report an image as applied when its processor mode fails', async () => {
        const processor = createProcessor();
        processor.setMode.mockRejectedValueOnce(new Error('Failed to load background image'));
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { getAppliedBackgroundEffect, result } = setup();

        await act(async () => {
            await result.current.selectBackgroundEffect('office');
        });
        consoleError.mockRestore();

        expect(getAppliedBackgroundEffect()).toBe('none');
        expect(processorMocks.ensureBackgroundProcessor).not.toHaveBeenCalled();
    });

    it('reports a virtual background, not blur, as the effect being initialized', async () => {
        const processor = createProcessor();
        // The pipeline is still warming up, so the overlay has to name what it is waiting for.
        processor.waitUntilApplied.mockReturnValue(new Promise(() => {}));
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getBackgroundState, result } = setup();

        await act(async () => {
            await result.current.selectBackgroundEffect('office');
        });

        expect(getBackgroundState().initializingBackgroundEffect).toBe('virtualBackground');
    });

    it('clears the initializing state once the pipeline is running', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getBackgroundState, result } = setup();

        await act(async () => {
            await result.current.selectBackgroundEffect('office');
        });

        expect(getBackgroundState().initializingBackgroundEffect).toBeNull();
    });

    it('applies the last pick when backgrounds are clicked in quick succession', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getBackgroundState, result } = setup();

        await act(async () => {
            const first = result.current.selectBackgroundEffect('protonDark');
            const second = result.current.selectBackgroundEffect('office');

            await Promise.all([first, second]);
        });

        expect(processor.setMode).toHaveBeenLastCalledWith(imageMode('office'));
        expect(getBackgroundState()).toMatchObject({
            appliedBackgroundEffect: 'office',
            pendingBackgroundEffect: null,
        });
    });

    it('swaps the image on the running processor instead of building a new one', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { result, track, rawFrameToggles } = setup();

        // Nothing is on the track yet, so the first pick has to swap the processor in.
        track.getProcessor.mockReturnValue(undefined);

        await act(async () => {
            await result.current.selectBackgroundEffect('protonDark');
        });

        expect(rawFrameToggles).toEqual([false, true]);

        // The processor now stays on the track, so switching images must reuse it.
        track.getProcessor.mockReturnValue(processor);

        await act(async () => {
            await result.current.selectBackgroundEffect('mountain');
        });

        expect(processorMocks.createBackgroundProcessor).toHaveBeenCalledTimes(1);
        expect(processor.setMode).toHaveBeenLastCalledWith(imageMode('mountain'));
        expect(track.stopProcessor).not.toHaveBeenCalled();
        // Blanking the camera is only needed while swapping, so an image change must not flicker.
        expect(rawFrameToggles).toEqual([false, true]);
    });

    it('switches between blur and a virtual background on the running processor', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getBackgroundState, result, track, rawFrameToggles } = setup();

        await act(async () => {
            await result.current.selectBackgroundEffect('blur');
        });

        // Blur is live on the track now.
        processor.hasAppliedMask.mockReturnValue(true);
        track.getProcessor.mockReturnValue(processor);
        rawFrameToggles.length = 0;

        await act(async () => {
            await result.current.selectBackgroundEffect('mountain');
        });

        // A second processor is what used to make this switch stall: a new segmenter
        // worker, a track swap and a run of black warmup frames.
        expect(processorMocks.createBackgroundProcessor).toHaveBeenCalledTimes(1);
        expect(processor.setMode).toHaveBeenLastCalledWith(imageMode('mountain'));
        expect(track.stopProcessor).not.toHaveBeenCalled();
        expect(rawFrameToggles).toEqual([]);
        // Already on screen, so naming it as initializing would flash the overlay.
        expect(getBackgroundState().initializingBackgroundEffect).toBeNull();
        expect(getBackgroundState().appliedBackgroundEffect).toBe('mountain');

        await act(async () => {
            await result.current.selectBackgroundEffect('blur');
        });

        expect(processor.setMode).toHaveBeenLastCalledWith({ type: 'blur' });
        expect(getBackgroundState().initializingBackgroundEffect).toBeNull();
        expect(rawFrameToggles).toEqual([]);
    });

    it('clears the virtual background when picking no effect', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getAppliedBackgroundEffect, result } = setup();

        await act(async () => {
            await result.current.selectBackgroundEffect('library');
        });
        await act(async () => {
            await result.current.selectBackgroundEffect('none');
        });

        expect(processor.disable).toHaveBeenCalled();
        expect(getAppliedBackgroundEffect()).toBe('none');
    });

    it('turns blur on without processing anything while the camera is off', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getAppliedBackgroundEffect, result } = setup({ cameraState: 'off' });

        // Let the processor finish loading
        await act(async () => {});

        await act(async () => {
            await result.current.selectBackgroundEffect('blur');
        });

        expect(getAppliedBackgroundEffect()).toBe('blur');
        // Nothing may be attached or started: there is no frame to process yet
        expect(processorMocks.ensureBackgroundProcessor).not.toHaveBeenCalled();
        expect(processor.enable).not.toHaveBeenCalled();
    });

    it('replaces the virtual background with blur picked while the camera was off, once it is on', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getAppliedBackgroundEffect, result, setCameraOff } = setup();

        await act(async () => {});

        await act(async () => {
            await result.current.selectBackgroundEffect('protonDark');
        });

        expect(processor.enable).toHaveBeenCalled();

        setCameraOff(true);

        await act(async () => {
            await result.current.selectBackgroundEffect('blur');
        });

        // The toggle reflects the pick even though the camera cannot show it yet
        expect(getAppliedBackgroundEffect()).toBe('blur');

        // The virtual background is dropped right away, so it cannot come back with the camera
        expect(processor.setMode).toHaveBeenLastCalledWith({ type: 'blur' });

        setCameraOff(false);

        await act(async () => {
            await result.current.reapplyBackgroundEffect(true);
        });

        // Attaching is what puts blur on the track: setProcessor re-enables the processor it inits
        expect(processorMocks.ensureBackgroundProcessor).toHaveBeenLastCalledWith(expect.anything(), processor);
    });

    it('does not attach blur to the stopped track left behind when the camera is turned off', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getBackgroundState, result, setCameraOff } = setup();

        // Let the processor finish loading
        await act(async () => {});

        await act(async () => {
            await result.current.selectBackgroundEffect('blur');
        });

        processorMocks.ensureBackgroundProcessor.mockClear();

        setCameraOff(true);

        await act(async () => {
            await result.current.reapplyBackgroundEffect(true);
        });

        // A processor on a stopped track never sees a frame, so reporting it as initializing would
        // leave the spinner up forever.
        expect(processorMocks.ensureBackgroundProcessor).not.toHaveBeenCalled();
        expect(getBackgroundState().initializingBackgroundEffect).toBeNull();
    });

    it('re-applies a background that failed to attach when it is picked again', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        // No processor could be attached to the track on the first attempt.
        processorMocks.ensureBackgroundProcessor.mockResolvedValueOnce(null);

        const { result } = setup();

        await act(async () => {
            await result.current.selectBackgroundEffect('protonDark');
        });

        expect(processor.enable).not.toHaveBeenCalled();

        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        await act(async () => {
            await result.current.selectBackgroundEffect('protonDark');
        });

        expect(processor.enable).toHaveBeenCalled();
    });

    it('stops reporting the previous effect once the next one fails to attach', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getAppliedBackgroundEffect, getBackgroundState, result } = setup();

        // Let the processor finish loading
        await act(async () => {});

        await act(async () => {
            await result.current.selectBackgroundEffect('blur');
        });

        expect(getAppliedBackgroundEffect()).toBe('blur');

        // A swap that fails can leave the track carrying no processor at all.
        processorMocks.ensureBackgroundProcessor.mockResolvedValueOnce(null);

        await act(async () => {
            await result.current.selectBackgroundEffect('mountain');
        });

        // Blur is gone from the track, so continuing to report it would show the camera as
        // blurred while the raw frames are published to the whole meeting.
        expect(processor.disable).toHaveBeenCalled();
        expect(getAppliedBackgroundEffect()).toBe('none');
        expect(getBackgroundState().failedBackgroundEffect).toBe('virtualBackground');
    });

    it('keeps the pick when an attach is skipped because another one is already running', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getAppliedBackgroundEffect, getBackgroundState, result } = setup();

        // Let the processor finish loading
        await act(async () => {});

        await act(async () => {
            await result.current.selectBackgroundEffect('blur');
        });

        // Hold the reapply attach open so the next pick runs into the in-progress guard.
        let releaseAttach: () => void = () => {};
        const attachStarted = new Promise<void>((onStarted) => {
            processorMocks.ensureBackgroundProcessor.mockImplementationOnce((_track, instance) => {
                onStarted();

                return new Promise((resolve) => {
                    releaseAttach = () => resolve(instance);
                });
            });
        });

        await act(async () => {
            const reapplying = result.current.reapplyBackgroundEffect(true);

            await attachStarted;

            await result.current.selectBackgroundEffect('mountain');

            releaseAttach();

            await reapplying;
        });

        // The attach was only deferred, so treating it as a failure would drop the user's pick and
        // claim the effect could not be initialized.
        expect(getAppliedBackgroundEffect()).toBe('mountain');
        expect(getBackgroundState().failedBackgroundEffect).toBeNull();
    });

    it('restores the background picked in a previous session', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getAppliedBackgroundEffect } = setup({ appliedBackgroundEffect: 'beach' });

        await act(async () => {});

        // The processor is warmed up ahead of the camera, so turning it on does not publish
        // unprocessed frames while the pipeline is built.
        expect(processor.setMode).toHaveBeenCalledWith(imageMode('beach'));
        expect(getAppliedBackgroundEffect()).toBe('beach');
    });

    it('does not let a slow restored-background warmup overwrite a newer pick', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        let resolveRestoredSource: (source: ReturnType<typeof getVirtualBackgroundSource>) => void = () => {};
        backgroundSourceMocks.resolveBackgroundSource
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveRestoredSource = resolve;
                    })
            )
            .mockImplementation(async (effect: BackgroundEffect) =>
                getVirtualBackgroundSource(effect as Parameters<typeof getVirtualBackgroundSource>[0])
            );

        const { result } = setup({ appliedBackgroundEffect: 'beach' });

        await act(async () => {
            await result.current.selectBackgroundEffect('mountain');
        });

        await act(async () => {
            resolveRestoredSource(getVirtualBackgroundSource('beach'));
        });

        expect(processor.setMode).toHaveBeenCalledTimes(1);
        expect(processor.setMode).toHaveBeenCalledWith(imageMode('mountain'));
    });

    it('leaves the restored background alone as it is picked again', async () => {
        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { result } = setup({ appliedBackgroundEffect: 'beach' });

        await act(async () => {});

        await act(async () => {
            await result.current.selectBackgroundEffect('mountain');
        });

        // Warming up the restored pipeline is a one-off: following the applied effect instead would
        // rebuild it underneath every pick.
        expect(processorMocks.createBackgroundProcessor).toHaveBeenCalledTimes(1);
        expect(processor.setMode).toHaveBeenLastCalledWith(imageMode('mountain'));
    });

    it('ignores a stored virtual background once the feature is turned off', async () => {
        unleashMocks.useFlag.mockReturnValue(false);
        localStorage.setItem('meetVirtualBackground', 'protonDark');

        const processor = createProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(processor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, instance) => instance);

        const { getAppliedBackgroundEffect, result } = setup({ appliedBackgroundEffect: 'protonDark' });

        await act(async () => {});

        // Nothing is built or applied for it, so a rollback cannot strand the user with a
        // background they no longer have any way to change.
        expect(processor.setMode).not.toHaveBeenCalled();

        await act(async () => {
            await result.current.selectBackgroundEffect('office');
        });

        expect(processor.setMode).not.toHaveBeenCalled();
        // The pick is hidden on read rather than thrown away, so it comes back with the feature.
        expect(getAppliedBackgroundEffect()).toBe('protonDark');
        expect(localStorage.getItem('meetVirtualBackground')).toBe('protonDark');
    });
});
