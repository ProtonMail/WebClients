import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { chatAndReactionsReducer } from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    getPersistedSettingsState,
    setJoinLeaveSoundsEnabledAndPersist,
    settingsReducer,
} from '@proton/meet/store/slices/settings';
import { ParticipantEvent } from '@proton/meet/types/types';
import { STT_AGENT_PREFIX } from '@proton/meet/utils/agents';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { getActivityEventRows } from '../../components/MeetingDetails/getActivityEventRows';
import { JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT } from '../../constants';
import { useParticipantEvents } from './useParticipantEvents';

type Listener = (participant?: { identity: string; isAgent?: boolean }) => Promise<void> | void;

const createFakeRoom = () => {
    const listeners: Record<string, Listener[]> = {};

    return {
        localParticipant: { identity: 'local' },
        remoteParticipants: new Map<string, { identity: string; isAgent?: boolean }>(),
        numParticipants: 1,
        on: vi.fn((event: string, listener: Listener) => {
            listeners[event] = [...(listeners[event] ?? []), listener];
        }),
        off: vi.fn((event: string, listener: Listener) => {
            listeners[event] = (listeners[event] ?? []).filter((l) => l !== listener);
        }),
        emit: async (event: string, participant?: { identity: string; isAgent?: boolean }) => {
            await Promise.all((listeners[event] ?? []).map((listener) => listener(participant)));
        },
    };
};

const mocks = vi.hoisted(() => ({
    room: null as unknown as ReturnType<typeof createFakeRoom>,
    enabledFlags: [] as string[],
    players: {} as Record<string, ReturnType<typeof vi.fn>>,
    now: 0,
}));

vi.mock('@livekit/components-react', () => ({
    useRoomContext: () => mocks.room,
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: (flag: string) => mocks.enabledFlags.includes(flag),
}));

vi.mock('../../contexts/MeetCoreClientContext', () => ({
    useMeetCoreClient: () => ({ setLivekitActiveUuids: () => Promise.resolve() }),
}));

vi.mock('../useAudioPlayer', () => ({
    useAudioPlayer: (path: string) => {
        mocks.players[path] ??= vi.fn();
        return { playAudio: mocks.players[path] };
    },
}));

const JOIN_SOUND = '/assets/sounds/participant_joined.wav';
const LEAVE_SOUND = '/assets/sounds/participant_left.wav';
const LEGACY_JOIN_SOUND = '/assets/sounds/join_notification.wav';

const createStore = () =>
    configureStore({
        reducer: { ...chatAndReactionsReducer, ...settingsReducer },
        preloadedState: { meetSettings: getPersistedSettingsState() },
    });

const renderParticipantEvents = () => {
    const store = createStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider context={ProtonStoreContext} store={store}>
            {children}
        </Provider>
    );

    const { result, rerender } = renderHook(
        () => {
            useParticipantEvents();
            return useMeetDispatch();
        },
        { wrapper }
    );

    return { store, dispatch: result.current, rerender };
};

const emitJoin = (identity: string) => {
    mocks.room.remoteParticipants.set(identity, { identity });
    mocks.room.numParticipants = mocks.room.remoteParticipants.size + 1;
    return mocks.room.emit('participantConnected', { identity });
};

const emitLeave = (identity: string) => {
    mocks.room.remoteParticipants.delete(identity);
    mocks.room.numParticipants = mocks.room.remoteParticipants.size + 1;
    return mocks.room.emit('participantDisconnected', { identity });
};

const join = (identity: string) => act(() => emitJoin(identity));

const leave = (identity: string) => act(() => emitLeave(identity));

const TICK_DURATION_MS = 1000;

const ticks = {
    aliceJoins: () => emitJoin('alice'),
    participantDisconnected: () => emitLeave('alice'),
    participantConnected: () => emitJoin('bob'),
    sameTickDisconnectAndConnect: () => Promise.all([emitLeave('alice'), emitJoin('alice')]),
    reconnecting: () => Promise.all([emitLeave('alice'), mocks.room.emit('reconnecting')]),
    reconnectingWithNoOneToReplay: () => mocks.room.emit('reconnecting'),
    reconnected: () => Promise.all([mocks.room.emit('reconnected'), emitJoin('alice')]),
    reconnectedWithoutAlice: () => mocks.room.emit('reconnected'),
    disconnected: () => mocks.room.emit('disconnected'),
    reconnectedThenReconnectingAgain: () =>
        Promise.all([
            mocks.room.emit('reconnected'),
            emitJoin('alice'),
            emitLeave('alice'),
            mocks.room.emit('reconnecting'),
        ]),
    // The hook unmutes sounds in a deferred timer after 'reconnected'; only this tick may run it.
    setTimeoutTick: async () => {
        vi.runOnlyPendingTimers();
    },
    resubscribe: async (rerender: () => void) => {
        mocks.enabledFlags = [...mocks.enabledFlags, 'MeetSoundNotificationsEnabled'];
        rerender();
    },
};

type TickName = keyof typeof ticks;

const runTicks = async (tickNames: TickName[], rerender: () => void) => {
    for (const tickName of tickNames) {
        mocks.now += TICK_DURATION_MS;
        await act(async () => {
            await ticks[tickName](rerender);
        });
    }
};

const ticksToState = {
    connected: ['aliceJoins'],
    'reconnecting window 1': ['aliceJoins', 'reconnecting'],
    'disconnected during window 1': ['aliceJoins', 'reconnecting', 'disconnected'],
    'rejoined after disconnecting during window 1': ['aliceJoins', 'reconnecting', 'disconnected', 'aliceJoins'],
    'just reconnected from window 1': ['aliceJoins', 'reconnecting', 'reconnected'],
    'connected after window 1': ['aliceJoins', 'reconnecting', 'reconnected', 'setTimeoutTick'],
    'reconnecting window 2': ['aliceJoins', 'reconnecting', 'reconnected', 'setTimeoutTick', 'reconnecting'],
    'reconnecting window 2 before the timer of window 1': [
        'aliceJoins',
        'reconnecting',
        'reconnectedThenReconnectingAgain',
        'setTimeoutTick',
    ],
    'reconnecting window 2 after alice left in window 1 and a re-subscribe': [
        'aliceJoins',
        'reconnecting',
        'reconnectedWithoutAlice',
        'setTimeoutTick',
        'resubscribe',
        'reconnectingWithNoOneToReplay',
    ],
} satisfies Record<string, TickName[]>;

const { Join, Leave } = ParticipantEvent;

describe('useParticipantEvents', () => {
    beforeEach(() => {
        localStorage.clear();
        mocks.room = createFakeRoom();
        mocks.players = {};
        mocks.enabledFlags = ['MeetJoinLeaveSoundsNotifications'];
        mocks.now = 0;
        vi.spyOn(Date, 'now').mockImplementation(() => mocks.now);
        // A real timer could fire whenever `act` yields to the event loop, before the next tick on a slow runner
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('with join and leave sounds', () => {
        it('should play the join sound when another participant joins', async () => {
            renderParticipantEvents();

            await join('alice');

            expect(mocks.players[JOIN_SOUND]).toHaveBeenCalledTimes(1);
            expect(mocks.players[LEAVE_SOUND]).not.toHaveBeenCalled();
        });

        it('should play the leave sound when another participant leaves', async () => {
            renderParticipantEvents();

            await join('alice');
            await leave('alice');

            expect(mocks.players[LEAVE_SOUND]).toHaveBeenCalledTimes(1);
        });

        it('should play neither sound when the setting is disabled', async () => {
            localStorage.setItem('guest.joinLeaveSounds', 'false');
            renderParticipantEvents();

            await join('alice');
            await leave('alice');

            expect(mocks.players[JOIN_SOUND]).not.toHaveBeenCalled();
            expect(mocks.players[LEAVE_SOUND]).not.toHaveBeenCalled();
        });

        it('should apply a setting change during the meeting', async () => {
            const { dispatch } = renderParticipantEvents();

            await join('alice');
            act(() => {
                dispatch(setJoinLeaveSoundsEnabledAndPersist(false));
            });
            await join('bob');
            await leave('alice');

            expect(mocks.players[JOIN_SOUND]).toHaveBeenCalledTimes(1);
            expect(mocks.players[LEAVE_SOUND]).not.toHaveBeenCalled();

            act(() => {
                dispatch(setJoinLeaveSoundsEnabledAndPersist(true));
            });
            await leave('bob');

            expect(mocks.players[LEAVE_SOUND]).toHaveBeenCalledTimes(1);
        });

        it(`should stay silent while there are more than ${JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT} participants`, async () => {
            renderParticipantEvents();

            for (let i = 1; i < JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT; i++) {
                await join(`participant-${i}`);
            }
            expect(mocks.players[JOIN_SOUND]).toHaveBeenCalledTimes(JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT - 1);

            await join('one-too-many');
            expect(mocks.players[JOIN_SOUND]).toHaveBeenCalledTimes(JOIN_SOUND_NOTIFICATION_PARTICIPANT_LIMIT - 1);

            await join('another-one');
            await leave('another-one');
            expect(mocks.players[LEAVE_SOUND]).not.toHaveBeenCalled();

            await leave('one-too-many');
            expect(mocks.players[LEAVE_SOUND]).toHaveBeenCalledTimes(1);
        });

        it('should not play a sound for the captions agent', async () => {
            renderParticipantEvents();

            await join(`${STT_AGENT_PREFIX}captions`);

            expect(mocks.players[JOIN_SOUND]).not.toHaveBeenCalled();
        });

        it('should play a sound and record an event for each of several quick joins and leaves', async () => {
            const { store } = renderParticipantEvents();

            await act(async () => {
                mocks.room.remoteParticipants.set('alice', { identity: 'alice' });
                mocks.room.remoteParticipants.set('bob', { identity: 'bob' });
                await Promise.all([
                    mocks.room.emit('participantConnected', { identity: 'alice' }),
                    mocks.room.emit('participantConnected', { identity: 'bob' }),
                ]);
                mocks.room.remoteParticipants.clear();
                await Promise.all([
                    mocks.room.emit('participantDisconnected', { identity: 'alice' }),
                    mocks.room.emit('participantDisconnected', { identity: 'bob' }),
                ]);
            });

            expect(mocks.players[JOIN_SOUND]).toHaveBeenCalledTimes(2);
            expect(mocks.players[LEAVE_SOUND]).toHaveBeenCalledTimes(2);
            expect(store.getState().meetingChatAndReactions.events.map((event) => event.eventType)).toEqual([
                ParticipantEvent.Join,
                ParticipantEvent.Join,
                ParticipantEvent.Leave,
                ParticipantEvent.Leave,
            ]);
        });

        it('should stay silent while the local connection restarts', async () => {
            renderParticipantEvents();

            await join('alice');

            await act(async () => {
                mocks.room.remoteParticipants.delete('alice');
                const disconnected = mocks.room.emit('participantDisconnected', { identity: 'alice' });
                void mocks.room.emit('reconnecting');
                await disconnected;

                void mocks.room.emit('reconnected');
                mocks.room.remoteParticipants.set('alice', { identity: 'alice' });
                await mocks.room.emit('participantConnected', { identity: 'alice' });
            });

            expect(mocks.players[JOIN_SOUND]).toHaveBeenCalledTimes(1);
            expect(mocks.players[LEAVE_SOUND]).not.toHaveBeenCalled();

            await act(() => {
                vi.runOnlyPendingTimers();
            });
            await leave('alice');

            expect(mocks.players[LEAVE_SOUND]).toHaveBeenCalledTimes(1);
        });

        it.each<{
            state: keyof typeof ticksToState;
            event: TickName;
            records: [ParticipantEvent, string, number | undefined][];
            sounds: { join: number; leave: number };
        }>([
            {
                state: 'connected',
                event: 'participantDisconnected',
                records: [[Leave, 'alice', undefined]],
                sounds: { join: 0, leave: 1 },
            },
            {
                state: 'connected',
                event: 'participantConnected',
                records: [[Join, 'bob', undefined]],
                sounds: { join: 1, leave: 0 },
            },
            {
                state: 'connected',
                event: 'sameTickDisconnectAndConnect',
                records: [
                    [Leave, 'alice', undefined],
                    [Join, 'alice', undefined],
                ],
                sounds: { join: 1, leave: 1 },
            },
            {
                state: 'connected',
                event: 'reconnecting',
                records: [[Leave, 'alice', 2000]],
                sounds: { join: 0, leave: 0 },
            },
            {
                state: 'reconnecting window 1',
                event: 'reconnected',
                records: [[Join, 'alice', 2000]],
                sounds: { join: 0, leave: 0 },
            },
            {
                state: 'disconnected during window 1',
                event: 'aliceJoins',
                records: [[Join, 'alice', undefined]],
                sounds: { join: 0, leave: 0 },
            },
            {
                state: 'rejoined after disconnecting during window 1',
                event: 'participantDisconnected',
                records: [[Leave, 'alice', undefined]],
                sounds: { join: 0, leave: 0 },
            },
            {
                state: 'rejoined after disconnecting during window 1',
                event: 'participantConnected',
                records: [[Join, 'bob', undefined]],
                sounds: { join: 0, leave: 0 },
            },
            {
                state: 'just reconnected from window 1',
                event: 'participantConnected',
                records: [[Join, 'bob', 2000]],
                sounds: { join: 0, leave: 0 },
            },
            {
                state: 'just reconnected from window 1',
                event: 'participantDisconnected',
                records: [[Leave, 'alice', 2000]],
                sounds: { join: 0, leave: 0 },
            },
            {
                state: 'connected after window 1',
                event: 'participantDisconnected',
                records: [[Leave, 'alice', undefined]],
                sounds: { join: 0, leave: 1 },
            },
            {
                state: 'connected after window 1',
                event: 'sameTickDisconnectAndConnect',
                records: [
                    [Leave, 'alice', undefined],
                    [Join, 'alice', undefined],
                ],
                sounds: { join: 1, leave: 1 },
            },
            {
                state: 'connected after window 1',
                event: 'reconnecting',
                records: [[Leave, 'alice', 5000]],
                sounds: { join: 0, leave: 0 },
            },
            {
                state: 'reconnecting window 2',
                event: 'reconnected',
                records: [[Join, 'alice', 5000]],
                sounds: { join: 0, leave: 0 },
            },
            {
                state: 'reconnecting window 2 before the timer of window 1',
                event: 'reconnected',
                records: [[Join, 'alice', 3000]],
                sounds: { join: 0, leave: 0 },
            },
            {
                state: 'reconnecting window 2 after alice left in window 1 and a re-subscribe',
                event: 'reconnected',
                records: [[Join, 'alice', 6000]],
                sounds: { join: 0, leave: 0 },
            },
        ])('should record and sound $event in state $state', async ({ state, event, records, sounds }) => {
            const { store, rerender } = renderParticipantEvents();
            await runTicks(ticksToState[state], rerender);
            const recordCountBefore = store.getState().meetingChatAndReactions.events.length;
            Object.values(mocks.players).forEach((player) => player.mockClear());

            await runTicks([event], rerender);

            expect({
                join: mocks.players[JOIN_SOUND].mock.calls.length,
                leave: mocks.players[LEAVE_SOUND].mock.calls.length,
            }).toEqual(sounds);
            expect(
                store
                    .getState()
                    .meetingChatAndReactions.events.slice(recordCountBefore)
                    .map(({ eventType, identity, localReconnectId }) => [eventType, identity, localReconnectId])
            ).toEqual(records);
        });

        it('should show a join in a later reconnect window from someone who left in an earlier one, across a re-subscribe', async () => {
            const { store, rerender } = renderParticipantEvents();

            await runTicks(
                [
                    ...ticksToState['reconnecting window 2 after alice left in window 1 and a re-subscribe'],
                    'reconnected',
                ],
                rerender
            );

            const rows = getActivityEventRows({
                keyRotationLogs: [],
                participantEvents: store.getState().meetingChatAndReactions.events,
                nameMap: { alice: 'Alice' },
            });
            expect(rows.map(({ kind, timestamp }) => [kind, timestamp])).toEqual([
                ['participantJoined', 7000],
                ['participantJoined', 1000],
            ]);
        });

        it('should not play the legacy join sound', async () => {
            mocks.enabledFlags = [...mocks.enabledFlags, 'MeetSoundNotificationsEnabled'];
            renderParticipantEvents();

            await join('alice');

            expect(mocks.players[LEGACY_JOIN_SOUND]).not.toHaveBeenCalled();
        });
    });

    describe('without join and leave sounds', () => {
        beforeEach(() => {
            mocks.enabledFlags = [];
        });

        it('should play no join and leave sounds even if the setting is enabled', async () => {
            renderParticipantEvents();

            await join('alice');
            await leave('alice');

            expect(mocks.players[JOIN_SOUND]).not.toHaveBeenCalled();
            expect(mocks.players[LEAVE_SOUND]).not.toHaveBeenCalled();
        });

        it('should keep playing the legacy join sound', async () => {
            mocks.enabledFlags = ['MeetSoundNotificationsEnabled'];
            renderParticipantEvents();

            await join('alice');

            expect(mocks.players[LEGACY_JOIN_SOUND]).toHaveBeenCalledTimes(1);
        });
    });
});
