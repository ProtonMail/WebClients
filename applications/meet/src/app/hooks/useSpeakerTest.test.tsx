import { act, renderHook, waitFor } from '@testing-library/react';

import { useSpeakerTest } from './useSpeakerTest';

const mockUseMeetSelector = vi.fn();

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: (selector: unknown) => mockUseMeetSelector(selector),
}));

const mockSupportsSetSinkId = vi.fn();

vi.mock('../utils/browser', () => ({
    supportsSetSinkId: () => mockSupportsSetSinkId(),
}));

class MockAudio {
    static instances: MockAudio[] = [];

    public src: string;

    public preload = '';

    public currentTime = 0;

    public play = vi.fn(async () => undefined);

    public pause = vi.fn(() => this.dispatch('pause'));

    public setSinkId = vi.fn(async () => undefined);

    private listeners: Record<string, (() => void)[]> = {};

    constructor(src?: string) {
        this.src = src ?? '';
        MockAudio.instances.push(this);
    }

    addEventListener(type: string, listener: () => void) {
        this.listeners[type] = [...(this.listeners[type] ?? []), listener];
    }

    removeEventListener(type: string, listener: () => void) {
        this.listeners[type] = (this.listeners[type] ?? []).filter((item) => item !== listener);
    }

    dispatch(type: string) {
        this.listeners[type]?.forEach((listener) => listener());
    }
}

const getAudio = () => MockAudio.instances[MockAudio.instances.length - 1];

describe('useSpeakerTest', () => {
    beforeEach(() => {
        MockAudio.instances = [];
        mockUseMeetSelector.mockReturnValue(false);
        mockSupportsSetSinkId.mockReturnValue(true);
        vi.stubGlobal('Audio', MockAudio);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('plays the test sound on the selected speaker', async () => {
        const { result } = renderHook(() => useSpeakerTest('speaker-1'));

        await act(async () => {
            await result.current.playTestSound();
        });

        const audio = getAudio();
        expect(audio.src).toContain('speaker_test.wav');
        expect(audio.setSinkId).toHaveBeenCalledWith('speaker-1');
        expect(audio.play).toHaveBeenCalled();
        expect(result.current.isPlaying).toBe(true);
    });

    it('routes to the default output when no speaker is selected', async () => {
        const { result } = renderHook(() => useSpeakerTest(null));

        await act(async () => {
            await result.current.playTestSound();
        });

        expect(getAudio().setSinkId).toHaveBeenCalledWith('');
    });

    it('skips routing when the browser has no setSinkId support', async () => {
        mockSupportsSetSinkId.mockReturnValue(false);
        const { result } = renderHook(() => useSpeakerTest('speaker-1'));

        await act(async () => {
            await result.current.playTestSound();
        });

        expect(getAudio().setSinkId).not.toHaveBeenCalled();
        expect(getAudio().play).toHaveBeenCalled();
    });

    it('stops playing once the sound ends', async () => {
        const { result } = renderHook(() => useSpeakerTest('speaker-1'));

        await act(async () => {
            await result.current.playTestSound();
        });
        expect(result.current.isPlaying).toBe(true);

        act(() => {
            getAudio().dispatch('ended');
        });

        expect(result.current.isPlaying).toBe(false);
    });

    it('stops the sound on demand', async () => {
        const { result } = renderHook(() => useSpeakerTest('speaker-1'));

        await act(async () => {
            await result.current.playTestSound();
        });

        act(() => {
            result.current.stopTestSound();
        });

        expect(getAudio().pause).toHaveBeenCalled();
        expect(result.current.isPlaying).toBe(false);
    });

    it('reports a failure when playback is rejected', async () => {
        const { result } = renderHook(() => useSpeakerTest('speaker-1'));
        getAudio().play.mockRejectedValueOnce(new Error('blocked'));

        await act(async () => {
            await result.current.playTestSound();
        });

        expect(result.current.hasFailed).toBe(true);
        expect(result.current.isPlaying).toBe(false);
    });

    it('stops playback and refuses to start once joining begins', async () => {
        const { result, rerender } = renderHook(() => useSpeakerTest('speaker-1'));

        await act(async () => {
            await result.current.playTestSound();
        });

        mockUseMeetSelector.mockReturnValue(true);
        rerender();

        await waitFor(() => expect(getAudio().pause).toHaveBeenCalled());
        expect(result.current.isPlaying).toBe(false);

        getAudio().play.mockClear();
        await act(async () => {
            await result.current.playTestSound();
        });

        expect(getAudio().play).not.toHaveBeenCalled();
    });
});
