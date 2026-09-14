import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import type { MeetChatMessage, ParticipantEventRecord } from '../../types/types';
import { ParticipantEvent } from '../../types/types';
import { getMentionToken } from '../../utils/mentions/mentionToken';
import type { MeetState } from '../rootReducer';
import type { MeetAppStartListening } from '../store';
import { addChatMessages, addEvent, chatAndReactionsReducer, removeChatMessage } from './chatAndReactionsSlice';
import { meetingSnackbarsListener } from './meetingSnackbarsListener';
import {
    MENTION_SNACKBAR_TIMEOUT,
    SNACKBAR_TIMEOUT,
    dismissMeetingSnackbar,
    meetingSnackbarsReducer,
    selectMeetingSnackbars,
} from './meetingSnackbarsSlice';
import {
    initialState as initialParticipantsState,
    mergeParticipantDecryptedNameMap,
    participantsReducer,
} from './participants/participantsSlice';
import {
    initialState as initialSortedParticipantsState,
    setSortedParticipantIdentities,
    sortedParticipantsReducer,
} from './participants/sortedParticipantsSlice';
import { MeetingSideBars, toggleSideBarState, uiStateReducer } from './uiStateSlice';

const LOCAL_IDENTITY = 'aaaaaaaa-1111-2222-3333-444444444444';

const createMessage = (id: string, message: string, identity = 'remote'): MeetChatMessage => ({
    id,
    message,
    identity,
    timestamp: Date.now(),
    type: 'message',
});

const createMention = (id: string) => createMessage(id, `hey ${getMentionToken(LOCAL_IDENTITY)}`);

const createJoinEvent = (identity: string): ParticipantEventRecord => ({
    identity,
    eventType: ParticipantEvent.Join,
    timestamp: Date.now(),
    type: 'event',
});

const setupSnackbarStore = ({ isMentionsEnabled = true }: { isMentionsEnabled?: boolean } = {}) => {
    const listenerMiddleware = createListenerMiddleware({
        extra: {
            unleashClient: { isEnabled: (flag: string) => flag === 'MeetChatMentions' && isMentionsEnabled },
        } as unknown as ProtonThunkArguments,
    });

    const store = configureStore({
        reducer: {
            ...chatAndReactionsReducer,
            ...meetingSnackbarsReducer,
            ...participantsReducer,
            ...sortedParticipantsReducer,
            ...uiStateReducer,
        },
        preloadedState: {
            participants: {
                ...initialParticipantsState,
                localParticipantIdentity: LOCAL_IDENTITY,
            },
            sortedParticipants: initialSortedParticipantsState,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({ serializableCheck: false }).prepend(listenerMiddleware.middleware),
    });

    meetingSnackbarsListener(listenerMiddleware.startListening as unknown as MeetAppStartListening);

    const typedStore = store as unknown as Omit<typeof store, 'dispatch' | 'getState'> & {
        dispatch: ThunkDispatch<MeetState, ProtonThunkArguments, UnknownAction>;
        getState: () => MeetState;
    };

    const receive = (...messages: MeetChatMessage[]) => typedStore.dispatch(addChatMessages(messages));

    const openChat = () => typedStore.dispatch(toggleSideBarState(MeetingSideBars.Chat));

    const getSnackbars = () => selectMeetingSnackbars(typedStore.getState());

    const getKeys = () => getSnackbars().map((snackbar) => snackbar.key);

    return { store: typedStore, receive, openChat, getSnackbars, getKeys };
};

describe('meetingSnackbars', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows a mention of the local participant', () => {
        const { receive, getSnackbars } = setupSnackbarStore();

        receive(createMention('1'));

        expect(getSnackbars()).toEqual([{ key: 'message-1', type: 'mention', messageId: '1' }]);
    });

    it('shows a mention as a regular update when mentions are disabled', () => {
        const { receive, getSnackbars } = setupSnackbarStore({ isMentionsEnabled: false });

        receive(createMention('1'));

        expect(getSnackbars()).toEqual([{ key: 'message-1', type: 'message', messageId: '1' }]);
    });

    it('shows a message that does not mention the local participant as a regular update', () => {
        const { receive, getSnackbars } = setupSnackbarStore();

        receive(createMessage('1', 'hello'));

        expect(getSnackbars()).toEqual([{ key: 'message-1', type: 'message', messageId: '1' }]);
    });

    it('replaces the previous regular update instead of stacking them', () => {
        const { receive, getKeys } = setupSnackbarStore();

        receive(createMessage('1', 'hello'));
        receive(createMessage('2', 'hi'));
        receive(createMessage('3', 'there'));

        expect(getKeys()).toEqual(['message-3']);
    });

    it('keeps mentions visible when a regular update replaces another one', () => {
        const { receive, getKeys } = setupSnackbarStore();

        receive(createMention('1'));
        receive(createMessage('2', 'hello'));
        receive(createMessage('3', 'hi'));

        expect(getKeys()).toEqual(['message-1', 'message-3']);
    });

    it('ignores mentions sent by the local participant', () => {
        const { receive, getSnackbars } = setupSnackbarStore();

        receive(createMessage('1', getMentionToken(LOCAL_IDENTITY), LOCAL_IDENTITY));

        expect(getSnackbars()).toMatchObject([{ key: 'message-1', type: 'message' }]);
    });

    it('ignores history replayed after a reconnect', () => {
        const { receive, getKeys } = setupSnackbarStore();

        receive({ ...createMention('1'), timestamp: Date.now() - SNACKBAR_TIMEOUT });

        expect(getKeys()).toEqual([]);
    });

    it('ignores the placeholder root of a thread whose real root is unavailable', () => {
        const { receive, getKeys } = setupSnackbarStore();

        receive({ ...createMessage('1', ''), isMissingRoot: true });

        expect(getKeys()).toEqual([]);
    });

    it('stacks up to three snackbars', () => {
        const { receive, getKeys } = setupSnackbarStore();

        receive(createMention('1'));
        receive(createMention('2'));
        receive(createMention('3'));

        expect(getKeys()).toEqual(['message-1', 'message-2', 'message-3']);
    });

    it('drops the oldest mention when a fourth mention arrives', () => {
        const { receive, getKeys } = setupSnackbarStore();

        receive(createMention('1'));
        receive(createMention('2'));
        receive(createMention('3'));
        receive(createMention('4'));

        expect(getKeys()).toEqual(['message-2', 'message-3', 'message-4']);
    });

    it('drops a regular update before a mention when the stack is full', () => {
        const { receive, getKeys } = setupSnackbarStore();

        receive(createMention('1'));
        receive(createMessage('2', 'hello'));
        receive(createMention('3'));
        receive(createMention('4'));

        expect(getKeys()).toEqual(['message-1', 'message-3', 'message-4']);
    });

    it('drops the oldest mention to make room for a regular update', () => {
        const { receive, getKeys } = setupSnackbarStore();

        receive(createMention('1'));
        receive(createMention('2'));
        receive(createMention('3'));
        receive(createMessage('4', 'hello'));

        expect(getKeys()).toEqual(['message-2', 'message-3', 'message-4']);
    });

    it('gives up only one mention slot to regular updates, reusing it for the ones that follow', () => {
        const { receive, getKeys } = setupSnackbarStore();

        receive(createMention('1'));
        receive(createMention('2'));
        receive(createMention('3'));
        receive(createMessage('4', 'hello'));
        receive(createMessage('5', 'hi'));
        receive(createMessage('6', 'there'));

        expect(getKeys()).toEqual(['message-2', 'message-3', 'message-6']);
    });

    it('drops the oldest update before a mention to make room for a regular update', () => {
        const { receive, getKeys } = setupSnackbarStore();

        receive(createMention('1'));
        receive(createMessage('2', 'hello'));
        receive(createMention('3'));
        receive(createMessage('4', 'hi'));

        expect(getKeys()).toEqual(['message-1', 'message-3', 'message-4']);
    });

    it('keeps mentions on screen while regular updates expire on their own', async () => {
        const { receive, getKeys } = setupSnackbarStore();

        receive(createMention('1'));
        receive(createMessage('2', 'hello'));

        await vi.advanceTimersByTimeAsync(SNACKBAR_TIMEOUT);

        expect(getKeys()).toEqual(['message-1']);
    });

    it('expires mentions once their longer timeout elapses', async () => {
        const { receive, getKeys } = setupSnackbarStore();

        receive(createMention('1'));

        await vi.advanceTimersByTimeAsync(MENTION_SNACKBAR_TIMEOUT);

        expect(getKeys()).toEqual([]);
    });

    it('does not bring back mentions that were dismissed or pushed out', () => {
        const { store, receive, getKeys } = setupSnackbarStore();

        receive(createMention('1'));
        receive(createMention('2'));
        receive(createMention('3'));
        receive(createMention('4'));

        store.dispatch(dismissMeetingSnackbar('message-4'));
        store.dispatch(dismissMeetingSnackbar('message-3'));
        store.dispatch(dismissMeetingSnackbar('message-2'));

        expect(getKeys()).toEqual([]);
    });

    it('clears the stack when the chat panel is opened, and skips what arrives while it is open', () => {
        const { receive, openChat, getKeys } = setupSnackbarStore();

        receive(createMention('1'));
        openChat();

        expect(getKeys()).toEqual([]);

        receive(createMention('2'));

        expect(getKeys()).toEqual([]);
    });

    it('shows a message once even when it is delivered twice', () => {
        const { receive, getKeys } = setupSnackbarStore();
        const message = createMention('1');

        receive(message);
        receive(message);

        expect(getKeys()).toEqual(['message-1']);
    });

    it('drops the snackbar of a message that leaves the chat', () => {
        const { store, receive, getKeys } = setupSnackbarStore();

        receive(createMention('1'));
        store.dispatch(removeChatMessage({ messageId: '1' }));

        expect(getKeys()).toEqual([]);
    });

    describe('participant events', () => {
        const setupStoreWithParticipants = (identities: string[]) => {
            const context = setupSnackbarStore();

            context.store.dispatch(setSortedParticipantIdentities(identities));
            context.store.dispatch(
                mergeParticipantDecryptedNameMap(Object.fromEntries(identities.map((id) => [id, `Name ${id}`])))
            );

            return context;
        };

        it('shows a join in a small meeting', () => {
            const { store, getSnackbars } = setupStoreWithParticipants([LOCAL_IDENTITY, 'remote']);
            const event = createJoinEvent('remote');

            store.dispatch(addEvent([event]));

            expect(getSnackbars()).toEqual([{ key: `event-remote-${event.timestamp}`, type: 'event', event }]);
        });

        it('stays quiet in a meeting large enough for joins and leaves to be noise', () => {
            const identities = ['a', 'b', 'c', 'd', 'e', 'f'];
            const { store, getKeys } = setupStoreWithParticipants(identities);

            store.dispatch(addEvent([createJoinEvent('a')]));

            expect(getKeys()).toEqual([]);
        });

        it('shows a join whose participant name is not known yet', () => {
            const { store, getKeys } = setupStoreWithParticipants([LOCAL_IDENTITY]);
            const event = createJoinEvent('unnamed');

            store.dispatch(addEvent([event]));

            expect(getKeys()).toEqual([`event-unnamed-${event.timestamp}`]);
        });

        it('replaces the previous join or leave instead of stacking them', () => {
            const { store, getKeys } = setupStoreWithParticipants([LOCAL_IDENTITY, 'a', 'b']);
            const second = createJoinEvent('b');

            store.dispatch(addEvent([createJoinEvent('a')]));
            store.dispatch(addEvent([second]));

            expect(getKeys()).toEqual([`event-b-${second.timestamp}`]);
        });

        it('shares its slot with regular updates', () => {
            const { store, receive, getKeys } = setupStoreWithParticipants([LOCAL_IDENTITY, 'remote']);
            const event = createJoinEvent('remote');

            receive(createMessage('1', 'hello'));
            store.dispatch(addEvent([event]));

            expect(getKeys()).toEqual([`event-remote-${event.timestamp}`]);

            receive(createMessage('2', 'hi'));

            expect(getKeys()).toEqual(['message-2']);
        });

        it('keeps mentions visible when a join replaces a regular update', () => {
            const { store, receive, getKeys } = setupStoreWithParticipants([LOCAL_IDENTITY, 'remote']);
            const event = createJoinEvent('remote');

            receive(createMention('1'));
            receive(createMessage('2', 'hello'));
            store.dispatch(addEvent([event]));

            expect(getKeys()).toEqual(['message-1', `event-remote-${event.timestamp}`]);
        });

        it('expires on its own like any other regular update', async () => {
            const { store, getKeys } = setupStoreWithParticipants([LOCAL_IDENTITY, 'remote']);

            store.dispatch(addEvent([createJoinEvent('remote')]));
            await vi.advanceTimersByTimeAsync(SNACKBAR_TIMEOUT);

            expect(getKeys()).toEqual([]);
        });
    });
});
