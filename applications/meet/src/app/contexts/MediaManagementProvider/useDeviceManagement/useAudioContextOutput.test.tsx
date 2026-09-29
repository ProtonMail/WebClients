import { act, renderHook } from '@testing-library/react';
import { ConnectionState, type Room } from 'livekit-client';
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAudioContextOutput } from './useAudioContextOutput';

const storeMocks = vi.hoisted(() => ({ useMeetSelector: vi.fn((_selector: unknown): unknown => undefined) }));
vi.mock('@proton/meet/store/hooks', () => storeMocks);

const browserMocks = vi.hoisted(() => ({ supportsSetSinkId: vi.fn(() => true) }));
vi.mock('../../../utils/browser', () => browserMocks);

type FakeState = 'suspended' | 'running' | 'closed' | 'interrupted';

// Mirrors RECOVERY_DELAYS_MS in the hook
const DELAYS_MS = [250, 500, 1_000, 2_000];

const createFakeAudioContext = (initialState: FakeState) => {
    const listeners = new Map<string, Set<() => void>>();

    const fake = {
        state: initialState as FakeState,
        addEventListener: (type: string, listener: () => void) => {
            const forType = listeners.get(type) ?? new Set<() => void>();
            forType.add(listener);
            listeners.set(type, forType);
        },
        removeEventListener: (type: string, listener: () => void) => {
            listeners.get(type)?.delete(listener);
        },
        emit: (type: string) => {
            listeners.get(type)?.forEach((listener) => listener());
        },
        goTo: (state: FakeState) => {
            fake.state = state;
            fake.emit('statechange');
        },
        listenerCount: () => [...listeners.values()].reduce((total, forType) => total + forType.size, 0),
    };

    return fake;
};

type SetSinkIdMock = Mock<(deviceId: string) => Promise<boolean>>;

const createSetSinkIdMock = () => vi.fn<(deviceId: string) => Promise<boolean>>();

const setup = ({
    initialState = 'suspended' as FakeState,
    startAudio = vi.fn().mockResolvedValue(undefined),
    roomState = ConnectionState.Connected,
    activeAudioOutputId = null as string | null,
    isPlaybackContext = true,
    sinkIdApplied = true,
    setSinkId = null as SetSinkIdMock | null,
} = {}) => {
    const audioContext = createFakeAudioContext(initialState);
    const setSinkIdMock = setSinkId ?? createSetSinkIdMock().mockResolvedValue(sinkIdApplied);
    const meetAudioContext = {
        audioContext: audioContext as unknown as AudioContext,
        setSinkId: setSinkIdMock,
        cleanup: vi.fn(),
    };
    const switchActiveDevice = vi.fn().mockResolvedValue(true);
    const room = {
        startAudio,
        switchActiveDevice,
        state: roomState,
        options: { webAudioMix: isPlaybackContext ? { audioContext } : false },
    } as unknown as Room;
    const reportMeetError = vi.fn();

    storeMocks.useMeetSelector.mockReturnValue(activeAudioOutputId);

    const { unmount, rerender } = renderHook(() => useAudioContextOutput({ meetAudioContext, room, reportMeetError }));

    const advance = async (ms: number) => {
        await act(async () => {
            await vi.advanceTimersByTimeAsync(ms);
        });
    };

    return {
        audioContext,
        startAudio,
        setSinkId: setSinkIdMock,
        switchActiveDevice,
        reportMeetError,
        unmount,
        rerender,
        advance,
    };
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

    it('leaves the sink alone while no output has been applied yet', () => {
        const { setSinkId } = setup({ activeAudioOutputId: null });

        expect(setSinkId).not.toHaveBeenCalled();
    });

    // Without this the context keeps the device it resolved at construction, and the system default
    // is the one output the user never switches away from, so nothing else would ever re-route it
    it('pins the context at the system default', () => {
        const { setSinkId } = setup({ activeAudioOutputId: '' });

        expect(setSinkId).toHaveBeenCalledWith('');
    });

    // Chrome takes its reference from the remote audio elements, so a fallback that only re-points
    // this context would leave the reference on a device that is no longer playing
    it('falls back through LiveKit when the pin fails, so the remote elements follow', async () => {
        const { switchActiveDevice, advance } = setup({ activeAudioOutputId: 'jabra', sinkIdApplied: false });

        await advance(0);

        expect(switchActiveDevice).toHaveBeenCalledWith('audiooutput', '');
    });

    // Chrome fires 'error' when the device this context renders to goes away, and the remote
    // elements are still pinned to it, so the whole output has to move
    it('moves the whole output to the default when the pinned device goes away', async () => {
        const { audioContext, switchActiveDevice, advance } = setup({ activeAudioOutputId: 'jabra' });

        await advance(0);
        audioContext.emit('error');
        await advance(0);

        expect(switchActiveDevice).toHaveBeenCalledWith('audiooutput', '');
    });

    // A pin that resolves after the user picked another device would otherwise drop the output to
    // the system default and discard that choice
    it('ignores a stale pin failure after the active device changed', async () => {
        let failFirstPin = () => {};
        const setSinkId = createSetSinkIdMock()
            .mockImplementationOnce(
                () =>
                    new Promise<boolean>((resolve) => {
                        failFirstPin = () => resolve(false);
                    })
            )
            .mockResolvedValue(true);

        const { switchActiveDevice, rerender, advance } = setup({ activeAudioOutputId: 'jabra', setSinkId });

        storeMocks.useMeetSelector.mockReturnValue('airpods');
        rerender();

        failFirstPin();
        await advance(0);

        expect(setSinkId).toHaveBeenLastCalledWith('airpods');
        expect(switchActiveDevice).not.toHaveBeenCalled();
    });

    it('recovers a lost device before any output has been applied', async () => {
        const { audioContext, switchActiveDevice, advance } = setup({ activeAudioOutputId: null });

        audioContext.emit('error');
        await advance(0);

        expect(switchActiveDevice).toHaveBeenCalledWith('audiooutput', '');
    });

    it('does not stack recoveries while one is in flight', async () => {
        const { audioContext, switchActiveDevice, advance } = setup({ activeAudioOutputId: 'jabra' });

        await advance(0);
        audioContext.emit('error');
        audioContext.emit('error');
        await advance(0);

        expect(switchActiveDevice).toHaveBeenCalledTimes(1);
    });

    it('leaves the output alone when the pin succeeds', async () => {
        const { switchActiveDevice, advance } = setup({ activeAudioOutputId: 'jabra' });

        await advance(0);

        expect(switchActiveDevice).not.toHaveBeenCalled();
    });

    // Pinning a sink on an idle context hands Chrome a silent echo cancellation reference
    it('leaves the sink alone when the room does not render through this context', () => {
        const { setSinkId } = setup({ activeAudioOutputId: 'jabra', isPlaybackContext: false });

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
