import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

const processorMocks = vi.hoisted(() => ({
    createBackgroundProcessor: vi.fn((): unknown => null),
    createCustomBackgroundProcessor: vi.fn(),
    ensureBackgroundProcessor: vi.fn(),
}));
vi.mock('../../processors/background-processor/createBackgroundProcessor', () => processorMocks);

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

    const { result } = renderHook(() => useBackgroundEffects({ backgroundProcessorVersion: 'current' }), {
        wrapper: ({ children }) => (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        ),
    });

    return { result, track, rawFrameToggles, setCameraOff, getBackgroundState, getAppliedBackgroundEffect };
};

describe('useBackgroundEffects', () => {
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
        unleashMocks.useFlag.mockReturnValue(true);
        localStorage.clear();
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

        const { getAppliedBackgroundEffect, result } = setup();

        await act(async () => {
            const pick = result.current.selectBackgroundEffect('blur');
            finishLoading();
            await pick;
        });

        expect(getAppliedBackgroundEffect()).toBe('blur');
        expect(blurProcessor.enable).toHaveBeenCalled();
    });

    it('applies the full-size image of the picked background to the camera track', async () => {
        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { getAppliedBackgroundEffect, result } = setup();

        await act(async () => {
            await result.current.selectBackgroundEffect('office');
        });

        const source = processorMocks.createCustomBackgroundProcessor.mock.calls[0][0] as { imageUrl?: string };

        expect(source.imageUrl).toContain('01-modern-office');
        // The full-size image and its thumbnail share a basename, so the directory is what
        // tells them apart: the picker's thumbnail must never reach the processor.
        expect(source.imageUrl).not.toContain('thumbnails');
        expect(customProcessor.enable).toHaveBeenCalled();
        expect(getAppliedBackgroundEffect()).toBe('office');
    });

    it('reports a virtual background, not blur, as the effect being initialized', async () => {
        const customProcessor = createCustomProcessor();
        // The pipeline is still warming up, so the overlay has to name what it is waiting for.
        customProcessor.waitUntilBackgroundApplied.mockReturnValue(new Promise(() => {}));
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { getBackgroundState, result } = setup();

        await act(async () => {
            await result.current.selectBackgroundEffect('office');
        });

        expect(getBackgroundState().initializingBackgroundEffect).toBe('virtualBackground');
    });

    it('clears the initializing state once the pipeline is running', async () => {
        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { getBackgroundState, result } = setup();

        await act(async () => {
            await result.current.selectBackgroundEffect('office');
        });

        expect(getBackgroundState().initializingBackgroundEffect).toBeNull();
    });

    it('applies the last pick when backgrounds are clicked in quick succession', async () => {
        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { getBackgroundState, result } = setup();

        await act(async () => {
            const first = result.current.selectBackgroundEffect('proton');
            const second = result.current.selectBackgroundEffect('office');

            await Promise.all([first, second]);
        });

        expect(customProcessor.setBackground).toHaveBeenLastCalledWith(getVirtualBackgroundSource('office'));
        expect(getBackgroundState()).toMatchObject({
            appliedBackgroundEffect: 'office',
            pendingBackgroundEffect: null,
        });
    });

    it('swaps the image on the running processor instead of building a new one', async () => {
        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result, track, rawFrameToggles } = setup();

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

        const { getAppliedBackgroundEffect, result } = setup();

        await act(async () => {
            await result.current.selectBackgroundEffect('coffee');
        });
        await act(async () => {
            await result.current.selectBackgroundEffect('none');
        });

        expect(customProcessor.disable).toHaveBeenCalled();
        expect(getAppliedBackgroundEffect()).toBe('none');
    });

    it('turns blur on without processing anything while the camera is off', async () => {
        const blurProcessor = createBlurProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(blurProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { getAppliedBackgroundEffect, result } = setup({ cameraState: 'off' });

        // Let the blur processor finish loading
        await act(async () => {});

        await act(async () => {
            await result.current.selectBackgroundEffect('blur');
        });

        expect(getAppliedBackgroundEffect()).toBe('blur');
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

        const { getAppliedBackgroundEffect, result, setCameraOff } = setup();

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
        expect(getAppliedBackgroundEffect()).toBe('blur');
        expect(blurProcessor.enable).not.toHaveBeenCalled();

        // The virtual background is dropped right away, so it cannot come back with the camera
        expect(customProcessor.disable).toHaveBeenCalled();

        setCameraOff(false);

        await act(async () => {
            await result.current.reapplyBackgroundEffect(true);
        });

        // Attaching is what puts blur on the track: setProcessor re-enables the processor it inits
        expect(processorMocks.ensureBackgroundProcessor).toHaveBeenLastCalledWith(expect.anything(), blurProcessor);
    });

    it('does not attach blur to the stopped track left behind when the camera is turned off', async () => {
        const blurProcessor = createBlurProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(blurProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { getBackgroundState, result, setCameraOff } = setup();

        // Let the blur processor finish loading
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
        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        // No processor could be attached to the track on the first attempt.
        processorMocks.ensureBackgroundProcessor.mockResolvedValueOnce(null);

        const { result } = setup();

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

        const { getAppliedBackgroundEffect, getBackgroundState, result } = setup();

        // Let the blur processor finish loading
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
        expect(blurProcessor.disable).toHaveBeenCalled();
        expect(getAppliedBackgroundEffect()).toBe('none');
        expect(getBackgroundState().failedBackgroundEffect).toBe('virtualBackground');
    });

    it('keeps the pick when an attach is skipped because another one is already running', async () => {
        const blurProcessor = createBlurProcessor();
        const customProcessor = createCustomProcessor();
        processorMocks.createBackgroundProcessor.mockResolvedValue(blurProcessor);
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { getAppliedBackgroundEffect, getBackgroundState, result } = setup();

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
            const reapplying = result.current.reapplyBackgroundEffect(true);

            await blurAttachStarted;

            await result.current.selectBackgroundEffect('mountain');

            releaseBlurAttach();

            await reapplying;
        });

        // The attach was only deferred, so treating it as a failure would drop the user's pick and
        // claim the effect could not be initialized.
        expect(getAppliedBackgroundEffect()).toBe('mountain');
        expect(getBackgroundState().failedBackgroundEffect).toBeNull();
    });

    it('restores the background picked in a previous session', async () => {
        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { getAppliedBackgroundEffect } = setup({ appliedBackgroundEffect: 'beach' });

        await act(async () => {});

        // The processor is warmed up ahead of the camera, so turning it on does not publish
        // unprocessed frames while the pipeline is built.
        expect(processorMocks.createCustomBackgroundProcessor).toHaveBeenCalledWith(
            getVirtualBackgroundSource('beach')
        );
        expect(getAppliedBackgroundEffect()).toBe('beach');
    });

    it('leaves the restored background alone as it is picked again', async () => {
        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { result } = setup({ appliedBackgroundEffect: 'beach' });

        await act(async () => {});

        await act(async () => {
            await result.current.selectBackgroundEffect('mountain');
        });

        // Warming up the restored pipeline is a one-off: following the applied effect instead would
        // rebuild it underneath every pick.
        expect(processorMocks.createCustomBackgroundProcessor).toHaveBeenCalledTimes(1);
    });

    it('ignores a stored virtual background once the feature is turned off', async () => {
        unleashMocks.useFlag.mockReturnValue(false);
        localStorage.setItem('meetVirtualBackground', 'proton');

        const customProcessor = createCustomProcessor();
        processorMocks.createCustomBackgroundProcessor.mockResolvedValue(customProcessor);
        processorMocks.ensureBackgroundProcessor.mockImplementation((_track, processor) => processor);

        const { getAppliedBackgroundEffect, result } = setup({ appliedBackgroundEffect: 'proton' });

        await act(async () => {});

        // Nothing is built or applied for it, so a rollback cannot strand the user with a
        // background they no longer have any way to change.
        expect(processorMocks.createCustomBackgroundProcessor).not.toHaveBeenCalled();

        await act(async () => {
            await result.current.selectBackgroundEffect('office');
        });

        expect(processorMocks.createCustomBackgroundProcessor).not.toHaveBeenCalled();
        // The pick is hidden on read rather than thrown away, so it comes back with the feature.
        expect(getAppliedBackgroundEffect()).toBe('proton');
        expect(localStorage.getItem('meetVirtualBackground')).toBe('proton');
    });
});
