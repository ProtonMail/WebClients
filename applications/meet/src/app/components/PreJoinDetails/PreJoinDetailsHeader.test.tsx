import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';

import { initialState as meetingInfoInitialState, meetingInfoReducer } from '@proton/meet/store/slices/meetingInfo';
import { meetingsReducer } from '@proton/meet/store/slices/meetings';
import { meetUserReducer } from '@proton/meet/store/slices/userSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';

import { PreJoinDetailsHeader } from './PreJoinDetailsHeader';

const { mockUseMeetings } = vi.hoisted(() => ({ mockUseMeetings: vi.fn() }));

vi.mock('@proton/meet/store/hooks/useMeetings', () => ({
    useMeetings: mockUseMeetings,
}));

const PERSONAL_ROOM_ID = 'personal-room-link';

const personalMeeting = {
    MeetingLinkName: PERSONAL_ROOM_ID,
    Type: MeetingType.PERSONAL,
} as Meeting;

const instantSubtitle = 'Our end-to-end encrypted meetings protect privacy and empower truly free expression.';
const defaultSubtitle = "You've been invited to join a secure meeting. Confirm your name and click below to enter.";

const renderHeader = ({
    roomName = '',
    roomId = 'regular-room-link',
    instantMeeting = false,
    isGuest = false,
    meetings = [] as Partial<Meeting>[],
    loading = false,
} = {}) => {
    mockUseMeetings.mockReturnValue([meetings, loading]);

    const store = configureStore({
        // @ts-expect-error - mock data
        reducer: {
            ...meetingsReducer,
            ...meetUserReducer,
            ...meetingInfoReducer,
        },
        preloadedState: {
            meet_meetings: {
                value: meetings,
                error: undefined,
                meta: { fetchedAt: 0, fetchedEphemeral: false },
            },
            meetUser: { isGuest },
            meetingInfo: { ...meetingInfoInitialState, meetingName: roomName },
        },
    });

    return render(<PreJoinDetailsHeader roomId={roomId} instantMeeting={instantMeeting} />, {
        wrapper: ({ children }) => (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        ),
    });
};

describe('PreJoinDetailsHeader', () => {
    beforeEach(() => {
        mockUseMeetings.mockReset();
    });

    describe('logged-in', () => {
        it('does not render the header while meetings are still loading', () => {
            renderHeader({ loading: true });

            expect(screen.queryByRole('heading')).not.toBeInTheDocument();
            expect(screen.queryByText('Join meeting')).not.toBeInTheDocument();
        });

        it('renders the header while loading for instant meetings', () => {
            renderHeader({ loading: true, instantMeeting: true });

            expect(screen.getByText('Talk confidentially')).toBeInTheDocument();
        });

        it('shows the room name when it is provided', () => {
            renderHeader({ roomName: 'Weekly sync', roomId: PERSONAL_ROOM_ID, meetings: [personalMeeting] });

            expect(screen.getByText('Weekly sync')).toBeInTheDocument();
            expect(screen.queryByText('Personal meeting room')).not.toBeInTheDocument();
        });

        it('shows the personal room copy when joining the user own personal meeting', () => {
            renderHeader({ roomId: PERSONAL_ROOM_ID, meetings: [personalMeeting] });

            const title = screen.getByText('Personal meeting room');

            expect(title).toBeInTheDocument();
            expect(title).toHaveClass('color-primary');
            expect(screen.getByText('Your always available meeting room')).toBeInTheDocument();
        });

        it('shows the instant meeting copy', () => {
            renderHeader({ instantMeeting: true });

            expect(screen.getByText('Talk confidentially')).toBeInTheDocument();
            expect(screen.getByText(instantSubtitle)).toBeInTheDocument();
        });

        it('shows the default join copy for a regular room', () => {
            renderHeader({ roomId: 'regular-room-link', meetings: [personalMeeting] });

            const title = screen.getByText('Join meeting');

            expect(title).toBeInTheDocument();
            expect(title).not.toHaveClass('color-primary');
            expect(screen.getByText(defaultSubtitle)).toBeInTheDocument();
        });
    });

    describe('guest', () => {
        it('renders the header even when meetings would be loading (bug fix)', () => {
            renderHeader({ isGuest: true, loading: true, instantMeeting: false });

            expect(screen.getByText('Join meeting')).toBeInTheDocument();
            expect(screen.getByText(defaultSubtitle)).toBeInTheDocument();
        });

        it('never shows the personal room copy even for a personal room link', () => {
            renderHeader({ isGuest: true, roomId: PERSONAL_ROOM_ID, meetings: [personalMeeting] });

            expect(screen.getByText('Join meeting')).toBeInTheDocument();
            expect(screen.queryByText('Personal meeting room')).not.toBeInTheDocument();
        });

        it('shows the instant meeting copy for a guest', () => {
            renderHeader({ isGuest: true, instantMeeting: true });

            expect(screen.getByText('Talk confidentially')).toBeInTheDocument();
        });
    });
});
