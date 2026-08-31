import { act, renderHook } from '@testing-library/react';
import { ConnectionState, type Room } from 'livekit-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAudioContextOutput } from './useAudioContextOutput';

const storeMocks = vi.hoisted(() => ({ useMeetSelector: vi.fn((_selector: unknown): unknown => undefined) }));
vi.mock('@proton/meet/store/hooks', () => storeMocks);

type FakeState = 'suspended' | 'running' | 'closed' | 'interrupted';

// Mirrors RECOVERY_DELAYS_MS in the hook
const DELAYS_MS = [250, 500, 1_000, 2_000];

const createFakeAudioContext = (initialState: FakeState) => {
    const listeners = new Set<() => void>();

    const fake = {
        state: initialState as FakeState,
        addEventListener: (_type: string, listener: () => void) => {
            listeners.add(listener);
        },
        removeEventListener: (_type: string, listener: () => void) => {
            listeners.delete(listener);
        },
        goTo: (state: FakeState) => {
            fake.state = state;
            listeners.forEach((listener) => listener());
        },
        listenerCount: () => listeners.size,
    };

    return fake;
};

const setup = ({
    initialState = 'suspended' as FakeState,
    startAudio = vi.fn().mockResolvedValue(undefined),
    roomState = ConnectionState.Connected,
    activeAudioOutputId = '',
} = {}) => {
    const audioContext = createFakeAudioContext(initialState);
    const setSinkId = vi.fn();
    const meetAudioContext = {
        audioContext: audioContext as unknown as AudioContext,
        setSinkId,
        cleanup: vi.fn(),
    };
    const room = { startAudio, state: roomState } as unknown as Room;
    const reportMeetError = vi.fn();

    storeMocks.useMeetSelector.mockReturnValue(activeAudioOutputId);

    const { unmount } = renderHook(() => useAudioContextOutput({ meetAudioContext, room, reportMeetError }));

    const advance = async (ms: number) => {
        await act(async () => {
            await vi.advanceTimersByTimeAsync(ms);
        });
    };

    return { audioContext, startAudio, setSinkId, reportMeetError, unmount, advance };
};

describe('useAudioContextOutput', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('points the context at the active output device', () => {
        const { setSinkId } = setup({ activeAudioOutputId: 'jabra' });

        expect(setSinkId).toHaveBeenCalledWith('jabra');
    });

    it('leaves the sink alone while no device is active yet', () => {
        const { setSinkId } = setup({ activeAudioOutputId: '' });

        expect(setSinkId).not.toHaveBeenCalled();
    });

    it('waits before the first attempt, because the device is still going away', async () => {
        const { audioContext, startAudio, advance } = setup({ initialState: 'running' });

        audioContext.goTo('suspended');
        expect(startAudio).not.toHaveBeenCalled();

        await advance(DELAYS_MS[0]);

        expect(startAudio).toHaveBeenCalledTimes(1);
    });

    it('keeps trying while the context stays silent', async () => {
        const { audioContext, startAudio, advance } = setup({ initialState: 'running' });

        audioContext.goTo('suspended');

        for (const [index, delay] of DELAYS_MS.entries()) {
            await advance(delay);
            expect(startAudio).toHaveBeenCalledTimes(index + 1);
        }

        // Every delay is spent, so nothing else should be attempted
        await advance(10_000);

        expect(startAudio).toHaveBeenCalledTimes(DELAYS_MS.length);
    });

    // startAudio() resolves even when the resume lost LiveKit's internal 200ms race, so a resolved
    // promise says nothing. Only the state does.
    it('stops as soon as the context is running again, not when startAudio resolves', async () => {
        const { audioContext, startAudio, advance } = setup({ initialState: 'running' });

        audioContext.goTo('suspended');
        await advance(DELAYS_MS[0]);
        expect(startAudio).toHaveBeenCalledTimes(1);

        audioContext.goTo('running');
        await advance(10_000);

        expect(startAudio).toHaveBeenCalledTimes(1);
    });

    it('reports when the context never comes back', async () => {
        const { audioContext, reportMeetError, advance } = setup({ initialState: 'running' });

        audioContext.goTo('suspended');
        await advance(10_000);

        expect(reportMeetError).toHaveBeenCalledWith(
            'Audio context stayed suspended after recovery attempts',
            expect.objectContaining({ tags: { audioContextState: 'suspended' } })
        );
    });

    it('stays quiet when the context recovers', async () => {
        const { audioContext, reportMeetError, advance } = setup({ initialState: 'running' });

        audioContext.goTo('suspended');
        await advance(DELAYS_MS[0]);
        audioContext.goTo('running');
        await advance(10_000);

        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('does not start a second loop while one is in flight', async () => {
        const { audioContext, startAudio, advance } = setup({ initialState: 'running' });

        audioContext.goTo('suspended');
        audioContext.goTo('suspended');
        audioContext.goTo('suspended');

        await advance(DELAYS_MS[0]);

        expect(startAudio).toHaveBeenCalledTimes(1);
    });

    it('recovers again after a later interruption', async () => {
        const { audioContext, startAudio, advance } = setup({ initialState: 'running' });

        audioContext.goTo('suspended');
        await advance(DELAYS_MS[0]);
        audioContext.goTo('running');

        // Let the loop in flight wind down before interrupting again
        await advance(10_000);
        const callsSoFar = startAudio.mock.calls.length;

        audioContext.goTo('suspended');
        await advance(DELAYS_MS[0]);

        expect(startAudio).toHaveBeenCalledTimes(callsSoFar + 1);
    });

    // Overlapping loops would stack attempts on a system that is already struggling to hand out the
    // device, and the loop in flight re-checks the state before every attempt anyway.
    it('lets the loop in flight cover a new interruption instead of stacking another one', async () => {
        const { audioContext, startAudio, advance } = setup({ initialState: 'running' });

        audioContext.goTo('suspended');
        await advance(DELAYS_MS[0]);
        expect(startAudio).toHaveBeenCalledTimes(1);

        audioContext.goTo('running');
        audioContext.goTo('suspended');

        await advance(DELAYS_MS[1]);

        expect(startAudio).toHaveBeenCalledTimes(2);
    });

    it("recovers Safari's interrupted state", async () => {
        const { audioContext, startAudio, advance } = setup({ initialState: 'running' });

        audioContext.goTo('interrupted');
        await advance(DELAYS_MS[0]);

        expect(startAudio).toHaveBeenCalledTimes(1);
    });

    it('leaves a disconnected room alone, because connecting resumes the context anyway', async () => {
        const { audioContext, startAudio, reportMeetError, advance } = setup({
            initialState: 'running',
            roomState: ConnectionState.Disconnected,
        });

        act(() => {
            audioContext.goTo('suspended');
        });
        await advance(DELAYS_MS.reduce((total, delay) => total + delay, 0));

        expect(startAudio).not.toHaveBeenCalled();
        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('still recovers while the room is reconnecting', async () => {
        const { audioContext, startAudio, advance } = setup({
            initialState: 'running',
            roomState: ConnectionState.Reconnecting,
        });

        act(() => {
            audioContext.goTo('suspended');
        });
        await advance(DELAYS_MS[0]);

        expect(startAudio).toHaveBeenCalled();
    });

    it('leaves the autoplay policy alone before anything has played', async () => {
        const { audioContext, startAudio, advance } = setup();

        audioContext.goTo('suspended');
        await advance(10_000);

        expect(startAudio).not.toHaveBeenCalled();
    });

    it('does not try to revive a closed context', async () => {
        const { audioContext, startAudio, reportMeetError, advance } = setup({ initialState: 'running' });

        audioContext.goTo('closed');
        await advance(10_000);

        expect(startAudio).not.toHaveBeenCalled();
        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('stops attempting once unmounted', async () => {
        const { audioContext, startAudio, unmount, advance } = setup({ initialState: 'running' });

        audioContext.goTo('suspended');
        unmount();
        await advance(10_000);

        expect(audioContext.listenerCount()).toBe(0);
        expect(startAudio).not.toHaveBeenCalled();
    });
});
