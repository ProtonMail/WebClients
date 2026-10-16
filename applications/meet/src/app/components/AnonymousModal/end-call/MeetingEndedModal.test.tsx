import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';

import {
    meetAppStateReducer,
    setMeetingEndedReason,
    setPreviousMeeting,
} from '@proton/meet/store/slices/meetAppStateSlice';
import type { MeetingEndedReason } from '@proton/meet/store/slices/meetAppStateSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { MeetingEndedModal } from './MeetingEndedModal';

vi.mock('./EndCallModalShell', () => ({
    EndCallModalShell: ({ title, subtitle }: { title: React.ReactNode; subtitle: string }) => (
        <>
            <h1>{title}</h1>
            <p>{subtitle}</p>
        </>
    ),
}));

const renderWithReason = (reason: unknown, meetingName?: string) => {
    const store = configureStore({ reducer: { ...meetAppStateReducer } });
    store.dispatch(setMeetingEndedReason(reason as MeetingEndedReason | null));
    if (meetingName) {
        store.dispatch(setPreviousMeeting({ link: null, name: meetingName }));
    }

    render(
        <Provider context={ProtonStoreContext} store={store}>
            <MeetingEndedModal open onClose={vi.fn()} action={vi.fn()} />
        </Provider>
    );
};

describe('MeetingEndedModal', () => {
    it('tells the host they have too many meetings in progress', () => {
        renderWithReason({ reason: 'AnotherMeetingInProgress', isLocalParticipantHost: true });

        expect(screen.getByText('You have too many meetings in progress')).toBeInTheDocument();
    });

    it('tells other participants the host has another meeting in progress', () => {
        renderWithReason({ reason: 'AnotherMeetingInProgress', isLocalParticipantHost: false });

        expect(screen.getByText('Host has another meeting in progress')).toBeInTheDocument();
    });

    it('tells the host the meeting reached the free plan time limit', () => {
        renderWithReason({ reason: 'TimeLimitExceeded', isLocalParticipantHost: true });

        expect(screen.getByText('Meeting time is up')).toBeInTheDocument();
        expect(screen.getByText(/reached the time limit of a free plan/)).toBeInTheDocument();
    });

    it('does not show the upgrade prompt to other participants on time limit', () => {
        renderWithReason({ reason: 'TimeLimitExceeded', isLocalParticipantHost: false });

        expect(screen.getByText('Meeting time is up')).toBeInTheDocument();
        expect(screen.getByText('This meeting reached the time limit.')).toBeInTheDocument();
    });

    it('names the meeting that ended because another meeting is in progress', () => {
        renderWithReason({ reason: 'AnotherMeetingInProgress', isLocalParticipantHost: true }, 'Design Weekly');

        expect(screen.getByText('Design Weekly has ended')).toBeInTheDocument();
    });

    it('names the meeting whose time is up', () => {
        renderWithReason({ reason: 'TimeLimitExceeded', isLocalParticipantHost: true }, 'Design Weekly');

        expect(screen.getByText('Time is up for Design Weekly')).toBeInTheDocument();
    });

    it('falls back to a generic ended title when there is no reason and no name', () => {
        renderWithReason(null);

        expect(screen.getByText('Meeting ended')).toBeInTheDocument();
    });
});
