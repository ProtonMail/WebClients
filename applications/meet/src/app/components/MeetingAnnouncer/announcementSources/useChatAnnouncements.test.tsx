import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';

import { addChatMessages, chatAndReactionsReducer } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { MENTION_SNACKBAR_TIMEOUT, SNACKBAR_TIMEOUT } from '@proton/meet/store/slices/meetingSnackbarsSlice';
import {
    initialState as participantsInitialState,
    participantsReducer,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { getMentionToken } from '@proton/meet/utils/mentions/mentionToken';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { useChatAnnouncements } from './useChatAnnouncements';

const announce = vi.fn();

vi.mock('@proton/components/components/liveAnnouncer/useAnnounce', () => ({ useAnnounce: () => announce }));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => true }));

const localIdentity = '11111111-1111-4111-8111-111111111111';

const renderChatAnnouncements = () => {
    const store = configureStore({
        reducer: { ...chatAndReactionsReducer, ...participantsReducer },
        preloadedState: {
            participants: {
                ...participantsInitialState,
                localParticipantIdentity: localIdentity,
                participantDecryptedNameMap: { [localIdentity]: 'Alice', bob: 'Bob' },
            },
        },
    });

    renderHook(() => useChatAnnouncements(), {
        wrapper: ({ children }) => (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        ),
    });

    return (id: string, message: string) => {
        act(() => {
            store.dispatch(addChatMessages([{ id, identity: 'bob', message, timestamp: 1 }]));
        });
    };
};

describe('useChatAnnouncements', () => {
    beforeEach(() => {
        announce.mockClear();
    });

    it('announces a chat message once, politely, for as long as its snackbar shows', () => {
        const receiveMessage = renderChatAnnouncements();

        receiveMessage('message-1', 'Hello');

        expect(announce).toHaveBeenCalledTimes(1);
        expect(announce).toHaveBeenCalledWith(
            'Bob says: Hello',
            expect.objectContaining({ politeness: 'polite', maxWaitMs: SNACKBAR_TIMEOUT })
        );
    });

    it('announces a mention once, politely, for as long as its snackbar shows', () => {
        const receiveMessage = renderChatAnnouncements();

        receiveMessage('message-1', `Hi ${getMentionToken(localIdentity)}`);

        expect(announce).toHaveBeenCalledTimes(1);
        expect(announce).toHaveBeenCalledWith(
            'Bob mentioned you: Hi @Alice',
            expect.objectContaining({ politeness: 'polite', maxWaitMs: MENTION_SNACKBAR_TIMEOUT })
        );
    });

    it('does not announce an earlier message again when a later one arrives', () => {
        const receiveMessage = renderChatAnnouncements();

        receiveMessage('message-1', 'First');
        receiveMessage('message-2', 'Second');

        expect(announce.mock.calls.map(([message]) => message)).toEqual(['Bob says: First', 'Bob says: Second']);
    });
});
