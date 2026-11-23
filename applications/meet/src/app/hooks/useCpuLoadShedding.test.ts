import { type ReactNode, createElement } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { ConnectionState, Track } from 'livekit-client';

import { cpuLoadReducer } from '@proton/meet/store/slices/cpuLoadSlice';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import type { CpuLoadLevel } from '../utils/cpuLoad/cpuLoadStepper';
import { DROP_AFTER_MS, FIRST_DROP_AFTER_MS, REVERT_AFTER_MS } from '../utils/cpuLoad/cpuLoadStepper';
import { CPU_LOAD_TICK_MS as TICK_MS, useCpuLoadShedding } from './useCpuLoadShedding';

const ALL_DROPS_AFTER_MS = FIRST_DROP_AFTER_MS + 2 * DROP_AFTER_MS;

const mocks = vi.hoisted(() => ({
    isEnabled: true,
    pressureLevel: 'critical' as CpuLoadLevel,
    republishCamera: vi.fn(),
    room: {
        state: 'connected' as ConnectionState,
        localParticipant: {
            on: vi.fn(),
            off: vi.fn(),
            videoTrackPublications: new Map(),
            trackPublications: new Map<string, unknown>(),
        },
    },
}));

vi.mock('../contexts/MediaManagementProvider/MediaManagementContext', () => ({
    useMediaManagementContext: () => ({ republishCamera: mocks.republishCamera }),
}));

const publishCamera = () => {
    const track = { isMuted: false, sender: {}, prioritizePerformance: vi.fn().mockResolvedValue(undefined) };
    mocks.room.localParticipant.trackPublications.set('camera', {
        kind: Track.Kind.Video,
        source: Track.Source.Camera,
        track,
    });
    return track;
};

vi.mock('@livekit/components-react', () => ({ useRoomContext: () => mocks.room }));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: (name: string) => name === 'MeetCpuLoadShedding' && mocks.isEnabled,
}));

vi.mock('../utils/cpuLoad/cpuPressureSignal', () => ({
    createCpuPressureSignal: () => ({ level: () => mocks.pressureLevel, stop: () => {} }),
}));

const renderCpuLoadShedding = () => {
    const store = configureStore({ reducer: { ...cpuLoadReducer } });
    const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(Provider, { context: ProtonStoreContext, store, children });
    const { rerender } = renderHook(() => useCpuLoadShedding(), { wrapper });
    return { dropCount: () => store.getState().cpuLoad.dropCount, rerender };
};

const advance = (durationMs: number) => act(() => vi.advanceTimersByTimeAsync(durationMs));

const interruptConnection = async (state: ConnectionState) => {
    mocks.room.state = state;
    await advance(TICK_MS);
    mocks.room.state = ConnectionState.Connected;
};

describe('useCpuLoadShedding', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mocks.isEnabled = true;
        mocks.room.localParticipant.on.mockClear();
        mocks.room.localParticipant.trackPublications.clear();
        mocks.republishCamera.mockReset().mockResolvedValue(true);
        mocks.pressureLevel = 'critical';
        mocks.room.state = ConnectionState.Connected;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it.each([ConnectionState.Reconnecting, ConnectionState.SignalReconnecting])(
        'should keep counting the critical load through a %s state',
        async (state) => {
            const { dropCount } = renderCpuLoadShedding();

            await advance(FIRST_DROP_AFTER_MS - TICK_MS);
            await interruptConnection(state);
            await advance(TICK_MS);

            expect(dropCount()).toBe(1);
        }
    );

    it.each([ConnectionState.Reconnecting, ConnectionState.SignalReconnecting])(
        'should not shed load during a long %s state and resume counting after it',
        async (state) => {
            const { dropCount } = renderCpuLoadShedding();

            await advance(FIRST_DROP_AFTER_MS - TICK_MS);
            mocks.room.state = state;
            await advance(120_000);
            expect(dropCount()).toBe(0);

            mocks.room.state = ConnectionState.Connected;
            await advance(TICK_MS);
            expect(dropCount()).toBe(1);
        }
    );

    it.each([ConnectionState.Reconnecting, ConnectionState.SignalReconnecting])(
        'should not count a long %s state toward reverting a drop',
        async (state) => {
            const { dropCount } = renderCpuLoadShedding();
            await advance(FIRST_DROP_AFTER_MS + TICK_MS);
            expect(dropCount()).toBe(1);

            mocks.pressureLevel = 'relieved';
            await advance(TICK_MS);
            mocks.room.state = state;
            await advance(120_000);
            mocks.room.state = ConnectionState.Connected;
            await advance(TICK_MS);
            expect(dropCount()).toBe(1);

            await advance(TICK_MS);
            expect(dropCount()).toBe(0);
        }
    );

    it.each([ConnectionState.Disconnected, ConnectionState.Connecting])(
        'should restart counting the critical load after a %s state',
        async (state) => {
            const { dropCount } = renderCpuLoadShedding();

            await advance(TICK_MS);
            await interruptConnection(state);
            await advance(FIRST_DROP_AFTER_MS);
            expect(dropCount()).toBe(0);

            await advance(TICK_MS);
            expect(dropCount()).toBe(1);
        }
    );

    it('should check the load every 5 seconds', async () => {
        const { dropCount } = renderCpuLoadShedding();

        await advance(FIRST_DROP_AFTER_MS + TICK_MS - 1);
        expect(dropCount()).toBe(0);

        await advance(1);
        expect(dropCount()).toBe(1);
    });

    it('should prioritize the camera performance on drop 3 and republish the camera when drop 3 is reverted', async () => {
        const camera = publishCamera();
        const { dropCount } = renderCpuLoadShedding();

        await advance(ALL_DROPS_AFTER_MS + TICK_MS);
        expect(dropCount()).toBe(3);
        expect(camera.prioritizePerformance).toHaveBeenCalledTimes(1);
        expect(mocks.republishCamera).not.toHaveBeenCalled();

        mocks.pressureLevel = 'relieved';
        await advance(REVERT_AFTER_MS + TICK_MS);
        expect(dropCount()).toBe(2);
        expect(mocks.republishCamera).toHaveBeenCalledTimes(1);
    });

    it('should try republishing the camera again on the next tick when a camera toggle was in progress', async () => {
        publishCamera();
        renderCpuLoadShedding();
        await advance(ALL_DROPS_AFTER_MS + TICK_MS);

        mocks.republishCamera.mockResolvedValueOnce(false);
        mocks.pressureLevel = 'relieved';
        await advance(REVERT_AFTER_MS + TICK_MS);
        expect(mocks.republishCamera).toHaveBeenCalledTimes(1);

        await advance(TICK_MS);
        expect(mocks.republishCamera).toHaveBeenCalledTimes(2);
    });

    it('should republish the camera when MeetCpuLoadShedding is turned off with drop 3 on', async () => {
        publishCamera();
        const { rerender } = renderCpuLoadShedding();
        await advance(ALL_DROPS_AFTER_MS + TICK_MS);

        mocks.isEnabled = false;
        rerender();

        expect(mocks.republishCamera).toHaveBeenCalledTimes(1);
    });

    it('should keep trying to republish the camera after MeetCpuLoadShedding is turned off', async () => {
        publishCamera();
        const { rerender } = renderCpuLoadShedding();
        await advance(ALL_DROPS_AFTER_MS + TICK_MS);

        mocks.republishCamera.mockResolvedValueOnce(false);
        mocks.isEnabled = false;
        rerender();
        expect(mocks.republishCamera).toHaveBeenCalledTimes(1);

        await advance(TICK_MS);
        expect(mocks.republishCamera).toHaveBeenCalledTimes(2);
    });

    it('should not shed load when MeetCpuLoadShedding is off', async () => {
        mocks.isEnabled = false;
        const { dropCount } = renderCpuLoadShedding();

        await advance(ALL_DROPS_AFTER_MS + TICK_MS);

        expect(dropCount()).toBe(0);
        expect(mocks.room.localParticipant.on).not.toHaveBeenCalled();
    });

    it('should revert every drop when MeetCpuLoadShedding is turned off mid-meeting', async () => {
        const { dropCount, rerender } = renderCpuLoadShedding();
        await advance(FIRST_DROP_AFTER_MS + TICK_MS);
        expect(dropCount()).toBe(1);

        mocks.isEnabled = false;
        rerender();
        await advance(ALL_DROPS_AFTER_MS);

        expect(dropCount()).toBe(0);
    });
});
