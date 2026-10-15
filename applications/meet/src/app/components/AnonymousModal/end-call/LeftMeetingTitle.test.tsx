import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';

import { meetAppStateReducer, setPreviousMeetingName } from '@proton/meet/store/slices/meetAppStateSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { LeftMeetingTitle } from './LeftMeetingTitle';

const createStore = () => configureStore({ reducer: { ...meetAppStateReducer } });

const renderLeftMeetingTitle = (store: ReturnType<typeof createStore>) =>
    render(
        <Provider context={ProtonStoreContext} store={store}>
            <LeftMeetingTitle />
        </Provider>
    );

describe('LeftMeetingTitle', () => {
    it('names the meeting the user left', () => {
        const store = createStore();
        store.dispatch(setPreviousMeetingName('Design Weekly'));

        renderLeftMeetingTitle(store);

        expect(screen.getByText('You left Design Weekly')).toBeInTheDocument();
    });

    it('falls back to a generic title when the meeting has no name', () => {
        renderLeftMeetingTitle(createStore());

        expect(screen.getByText('You left the meeting')).toBeInTheDocument();
    });
});
