import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';

import { meetAppStateReducer, setPreviousMeeting } from '@proton/meet/store/slices/meetAppStateSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import type { PostCallTitleKind } from './PostCallTitle';
import { PostCallTitle } from './PostCallTitle';

const createStore = () => configureStore({ reducer: { ...meetAppStateReducer } });

const renderPostCallTitle = (store: ReturnType<typeof createStore>, kind: PostCallTitleKind) =>
    render(
        <Provider context={ProtonStoreContext} store={store}>
            <PostCallTitle kind={kind} />
        </Provider>
    );

const titles: [PostCallTitleKind, string, string][] = [
    ['left', 'You left Design Weekly', 'You left the meeting'],
    ['ended', 'Design Weekly has ended', 'Meeting ended'],
    ['timeUp', 'Time is up for Design Weekly', 'Meeting time is up'],
    ['removed', 'You were removed from Design Weekly', 'You were removed from the meeting'],
];

describe('PostCallTitle', () => {
    it.each(titles)('names the meeting for the %s title', (kind, named) => {
        const store = createStore();
        store.dispatch(setPreviousMeeting({ link: null, name: 'Design Weekly' }));

        renderPostCallTitle(store, kind);

        expect(screen.getByText(named)).toBeInTheDocument();
    });

    it.each(titles)('falls back to a generic %s title when the meeting has no name', (kind, _named, fallback) => {
        renderPostCallTitle(createStore(), kind);

        expect(screen.getByText(fallback)).toBeInTheDocument();
    });

    it('applies the wrap and two-line clamp classes to the title', () => {
        const store = createStore();
        store.dispatch(setPreviousMeeting({ link: null, name: 'Design Weekly' }));

        renderPostCallTitle(store, 'left');

        expect(screen.getByText('You left Design Weekly')).toHaveClass('text-break', 'text-ellipsis-two-lines');
    });
});
