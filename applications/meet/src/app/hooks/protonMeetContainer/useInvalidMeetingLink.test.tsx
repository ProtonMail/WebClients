import { Provider } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { meetAppStateReducer } from '@proton/meet/store/slices/meetAppStateSlice';
import { meetingsThunk } from '@proton/meet/store/slices/meetings';
import { initialState as initialUserState, meetUserReducer } from '@proton/meet/store/slices/userSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { useInvalidMeetingLink } from './useInvalidMeetingLink';

vi.mock('react-router-dom', () => ({
    useHistory: vi.fn(),
    useLocation: vi.fn(),
}));

vi.mock('@proton/meet/store/slices/meetings', () => ({
    meetingsThunk: vi.fn(() => () => Promise.resolve([])),
}));

const useHistoryMock = useHistory as unknown as Mock;
const useLocationMock = useLocation as unknown as Mock;
const meetingsThunkMock = meetingsThunk as unknown as Mock;

const mockHistory = { push: vi.fn() };

const createMockStore = (isGuest: boolean) =>
    configureStore({
        reducer: {
            ...meetAppStateReducer,
            ...meetUserReducer,
        },
        preloadedState: {
            meetUser: { ...initialUserState, isGuest },
        },
    });

function createTestWrapper(store: ReturnType<typeof createMockStore>) {
    function TestWrapper({ children }: { children: React.ReactNode }) {
        return (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        );
    }
    return TestWrapper;
}

const renderInvalidMeetingLink = ({
    isGuest = false,
    hasMeetingDetails = false,
}: { isGuest?: boolean; hasMeetingDetails?: boolean } = {}) => {
    useLocationMock.mockReturnValue({
        state: hasMeetingDetails ? { meetingDetails: { meetingName: 'Standup' } } : undefined,
    });

    const store = createMockStore(isGuest);
    const { result } = renderHook(() => useInvalidMeetingLink(), { wrapper: createTestWrapper(store) });

    return { store, result };
};

describe('useInvalidMeetingLink', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useHistoryMock.mockReturnValue(mockHistory);
    });

    it('opens the modal and sends the user to the dashboard', () => {
        const { store, result } = renderInvalidMeetingLink();

        result.current.handleInvalidMeetingLink();

        expect(store.getState().meetAppState.invalidMeetingLinkModalOpen).toBe(true);
        expect(mockHistory.push).toHaveBeenCalledWith('/dashboard');
    });

    it('refreshes the meeting list when the user navigated from the dashboard', () => {
        const { result } = renderInvalidMeetingLink({ hasMeetingDetails: true });

        result.current.handleInvalidMeetingLink();

        expect(meetingsThunkMock).toHaveBeenCalledTimes(1);
    });

    it('does not refresh the meeting list when the link was opened directly', () => {
        const { result } = renderInvalidMeetingLink();

        result.current.handleInvalidMeetingLink();

        expect(meetingsThunkMock).not.toHaveBeenCalled();
    });

    it('does not refresh the meeting list for a guest', () => {
        const { result } = renderInvalidMeetingLink({ isGuest: true, hasMeetingDetails: true });

        result.current.handleInvalidMeetingLink();

        expect(meetingsThunkMock).not.toHaveBeenCalled();
    });
});
