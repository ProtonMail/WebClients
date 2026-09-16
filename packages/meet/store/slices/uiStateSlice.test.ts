import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import type { MeetState } from '../rootReducer';
import {
    MeetingSideBars,
    clearChatFocusedMessage,
    openChatAtMessage,
    selectChatFocusedMessageId,
    selectSideBarState,
    toggleSideBarState,
    uiStateReducer,
} from './uiStateSlice';

const createStore = () => {
    const store = configureStore({
        reducer: {
            ...uiStateReducer,
        },
    });
    return store as unknown as Omit<typeof store, 'getState'> & { getState: () => MeetState };
};

type Store = ReturnType<typeof createStore>;

const getSideBarState = (store: Store) => selectSideBarState(store.getState());
const getChatFocusedMessageId = (store: Store) => selectChatFocusedMessageId(store.getState());

describe('uiStateSlice', () => {
    describe('openChatAtMessage', () => {
        it('should open the chat side bar and mark the message to land on', () => {
            const store = createStore();

            store.dispatch(openChatAtMessage('message-1'));

            expect(getSideBarState(store)[MeetingSideBars.Chat]).toBe(true);
            expect(getChatFocusedMessageId(store)).toBe('message-1');
        });

        it('should close any other open side bar', () => {
            const store = createStore();
            store.dispatch(toggleSideBarState(MeetingSideBars.Participants));

            store.dispatch(openChatAtMessage('message-1'));

            expect(getSideBarState(store)[MeetingSideBars.Participants]).toBe(false);
            expect(getSideBarState(store)[MeetingSideBars.Chat]).toBe(true);
        });

        it('should keep the chat open when it already was', () => {
            const store = createStore();
            store.dispatch(toggleSideBarState(MeetingSideBars.Chat));

            store.dispatch(openChatAtMessage('message-1'));

            expect(getSideBarState(store)[MeetingSideBars.Chat]).toBe(true);
            expect(getChatFocusedMessageId(store)).toBe('message-1');
        });

        it('should retarget an already open chat at another message', () => {
            const store = createStore();
            store.dispatch(openChatAtMessage('message-1'));

            store.dispatch(openChatAtMessage('message-2'));

            expect(getChatFocusedMessageId(store)).toBe('message-2');
        });
    });

    describe('clearChatFocusedMessage', () => {
        it('should drop the target without closing the chat', () => {
            const store = createStore();
            store.dispatch(openChatAtMessage('message-1'));

            store.dispatch(clearChatFocusedMessage());

            expect(getChatFocusedMessageId(store)).toBeNull();
            expect(getSideBarState(store)[MeetingSideBars.Chat]).toBe(true);
        });
    });

    describe('toggleSideBarState', () => {
        it('should drop the target when the chat is closed again', () => {
            const store = createStore();
            store.dispatch(openChatAtMessage('message-1'));

            store.dispatch(toggleSideBarState(MeetingSideBars.Chat));

            expect(getSideBarState(store)[MeetingSideBars.Chat]).toBe(false);
            expect(getChatFocusedMessageId(store)).toBeNull();
        });

        it('should drop the target when another side bar takes over', () => {
            const store = createStore();
            store.dispatch(openChatAtMessage('message-1'));

            store.dispatch(toggleSideBarState(MeetingSideBars.Settings));

            expect(getChatFocusedMessageId(store)).toBeNull();
        });
    });
});
