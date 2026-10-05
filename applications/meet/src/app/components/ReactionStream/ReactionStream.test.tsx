import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { chatAndReactionsReducer, setActiveReaction } from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    initialState as initialParticipantsState,
    participantsReducer,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { RAISE_HAND_EMOJI } from '../../constants';
import { ReactionStream } from './ReactionStream';

const localIdentity = 'local-participant';
const remoteIdentity = 'remote-participant';

const createStore = () =>
    configureStore({
        reducer: {
            ...chatAndReactionsReducer,
            ...participantsReducer,
        },
        preloadedState: {
            participants: {
                ...initialParticipantsState,
                localParticipantIdentity: localIdentity,
                participantDecryptedNameMap: {
                    [localIdentity]: 'Local Person',
                    [remoteIdentity]: 'Elena Rossi',
                },
            },
        },
    });

const renderStream = (store = createStore()) => {
    render(
        <Provider context={ProtonStoreContext} store={store}>
            <ReactionStream />
        </Provider>
    );
    return store;
};

const react = (store: ReturnType<typeof createStore>, identity: string, emoji: string, timestamp: number) => {
    act(() => {
        store.dispatch(setActiveReaction({ identity, emoji, timestamp }));
    });
};

describe('ReactionStream', () => {
    afterEach(() => {
        cleanup();
    });

    it('streams an emoji reaction with the sender name', () => {
        const store = renderStream();

        react(store, remoteIdentity, '👍', 1);

        expect(screen.getByText('👍')).toBeInTheDocument();
        expect(screen.getByText('Elena Rossi')).toBeInTheDocument();
    });

    it('labels the local participant as "You"', () => {
        const store = renderStream();

        react(store, localIdentity, '🎉', 1);

        expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('does not stream the raised hand', () => {
        const store = renderStream();

        react(store, remoteIdentity, RAISE_HAND_EMOJI, 1);

        expect(screen.queryByText(RAISE_HAND_EMOJI)).not.toBeInTheDocument();
    });

    it('plays every new reaction, even the same emoji from the same participant', () => {
        const store = renderStream();

        react(store, remoteIdentity, '❤️', 1);
        react(store, remoteIdentity, '❤️', 2);

        expect(screen.getAllByText('❤️')).toHaveLength(2);
    });

    it('does not replay reactions that were already active on mount', () => {
        const store = createStore();
        store.dispatch(setActiveReaction({ identity: remoteIdentity, emoji: '👏', timestamp: 1 }));

        renderStream(store);

        expect(screen.queryByText('👏')).not.toBeInTheDocument();
    });

    it('removes a reaction once its animation ends', () => {
        const store = renderStream();

        react(store, remoteIdentity, '😁', 1);
        const item = screen.getByText('😁').parentElement as HTMLElement;
        fireEvent.animationEnd(item);

        expect(screen.queryByText('😁')).not.toBeInTheDocument();
    });
});
