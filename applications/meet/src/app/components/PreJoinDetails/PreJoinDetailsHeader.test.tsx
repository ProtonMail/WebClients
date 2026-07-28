import { render, screen } from '@testing-library/react';

import { PreJoinDetailsHeader } from './PreJoinDetailsHeader';

const instantSubtitle = 'Our end-to-end encrypted meetings protect privacy and empower truly free expression.';
const defaultSubtitle = "You've been invited to join a secure meeting. Confirm your name and click below to enter.";
const personalSubtitle = 'Your always available meeting room';

const renderHeader = ({ meetingName = '', instantMeeting = false, isPersonalRoom = false } = {}) =>
    render(
        <PreJoinDetailsHeader
            meetingName={meetingName}
            instantMeeting={instantMeeting}
            isPersonalRoom={isPersonalRoom}
        />
    );

describe('PreJoinDetailsHeader', () => {
    it('shows the meeting name when it is provided', () => {
        renderHeader({ meetingName: 'Weekly sync' });

        expect(screen.getByText('Weekly sync')).toBeInTheDocument();
        expect(screen.getByRole('heading')).not.toHaveClass('color-primary');
        expect(screen.getByText(defaultSubtitle)).toBeInTheDocument();
    });

    it('shows the personal room subtitle and highlights the title', () => {
        renderHeader({ isPersonalRoom: true });

        expect(screen.getByRole('heading')).toHaveClass('color-primary');
        expect(screen.getByText(personalSubtitle)).toBeInTheDocument();
    });

    it('keeps showing the meeting name for a personal room', () => {
        renderHeader({ meetingName: 'Weekly sync', isPersonalRoom: true });

        expect(screen.getByText('Weekly sync')).toBeInTheDocument();
        expect(screen.getByText(personalSubtitle)).toBeInTheDocument();
    });

    it('shows the instant meeting copy', () => {
        renderHeader({ instantMeeting: true });

        expect(screen.getByText('Talk confidentially')).toBeInTheDocument();
        expect(screen.getByText(instantSubtitle)).toBeInTheDocument();
    });

    it('prefers the meeting name over the instant meeting copy', () => {
        renderHeader({ meetingName: 'Weekly sync', instantMeeting: true });

        expect(screen.getByText('Weekly sync')).toBeInTheDocument();
        expect(screen.queryByText('Talk confidentially')).not.toBeInTheDocument();
    });

    it('shows the default join copy for a regular room', () => {
        renderHeader();

        expect(screen.getByText('Join meeting')).toBeInTheDocument();
        expect(screen.getByRole('heading')).not.toHaveClass('color-primary');
        expect(screen.getByText(defaultSubtitle)).toBeInTheDocument();
    });
});
