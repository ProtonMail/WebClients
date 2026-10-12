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
import { ProtonStoreContext } from '@proton/react-redux-store';

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

    const { result } = renderHook(
        () => {
            useParticipantEvents();
            return useMeetDispatch();
        },
        { wrapper }
    );

    return { store, dispatch: result.current };
};

const join = async (identity: string) => {
    mocks.room.remoteParticipants.set(identity, { identity });
    mocks.room.numParticipants = mocks.room.remoteParticipants.size + 1;
    await act(() => mocks.room.emit('participantConnected', { identity }));
};

const leave = async (identity: string) => {
    mocks.room.remoteParticipants.delete(identity);
    mocks.room.numParticipants = mocks.room.remoteParticipants.size + 1;
    await act(() => mocks.room.emit('participantDisconnected', { identity }));
};

describe('useParticipantEvents', () => {
    beforeEach(() => {
        localStorage.clear();
        mocks.room = createFakeRoom();
        mocks.players = {};
        mocks.enabledFlags = ['MeetJoinLeaveSoundsNotifications'];
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

            await act(() => new Promise((resolve) => setTimeout(resolve)));
            await leave('alice');

            expect(mocks.players[LEAVE_SOUND]).toHaveBeenCalledTimes(1);
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
