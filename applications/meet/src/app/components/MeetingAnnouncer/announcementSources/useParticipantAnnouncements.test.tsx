import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';

import { addEvent, chatAndReactionsReducer } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { SNACKBAR_TIMEOUT } from '@proton/meet/store/slices/meetingSnackbarsSlice';
import {
    initialState as participantsInitialState,
    participantsReducer,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { ParticipantEvent } from '@proton/meet/types/types';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { useParticipantAnnouncements } from './useParticipantAnnouncements';

const announce = vi.fn();

vi.mock('@proton/components/components/liveAnnouncer/useAnnounce', () => ({ useAnnounce: () => announce }));

const renderParticipantAnnouncements = () => {
    const store = configureStore({
        reducer: { ...chatAndReactionsReducer, ...participantsReducer },
        preloadedState: {
            participants: { ...participantsInitialState, participantDecryptedNameMap: { alice: 'Alice' } },
        },
    });

    renderHook(() => useParticipantAnnouncements(), {
        wrapper: ({ children }) => (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        ),
    });

    return (eventType: ParticipantEvent, timestamp: number) => {
        act(() => {
            store.dispatch(addEvent([{ identity: 'alice', eventType, timestamp }]));
        });
    };
};

describe('useParticipantAnnouncements', () => {
    beforeEach(() => {
        announce.mockClear();
    });

    it('announces a join once, politely, for as long as its snackbar shows', () => {
        const addParticipantEvent = renderParticipantAnnouncements();

        addParticipantEvent(ParticipantEvent.Join, 1);

        expect(announce).toHaveBeenCalledTimes(1);
        expect(announce).toHaveBeenCalledWith(
            'Alice joined the meeting',
            expect.objectContaining({ politeness: 'polite', maxWaitMs: SNACKBAR_TIMEOUT })
        );
    });

    it('announces a leave once, politely, for as long as its snackbar shows', () => {
        const addParticipantEvent = renderParticipantAnnouncements();

        addParticipantEvent(ParticipantEvent.Leave, 1);

        expect(announce).toHaveBeenCalledTimes(1);
        expect(announce).toHaveBeenCalledWith(
            'Alice left the meeting',
            expect.objectContaining({ politeness: 'polite', maxWaitMs: SNACKBAR_TIMEOUT })
        );
    });

    it('does not announce an earlier event again when a later one arrives', () => {
        const addParticipantEvent = renderParticipantAnnouncements();

        addParticipantEvent(ParticipantEvent.Join, 1);
        addParticipantEvent(ParticipantEvent.Leave, 2);

        expect(announce.mock.calls.map(([message]) => message)).toEqual([
            'Alice joined the meeting',
            'Alice left the meeting',
        ]);
    });
});
