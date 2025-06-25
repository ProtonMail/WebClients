import { render, screen } from '@testing-library/react';
import type { Participant } from 'livekit-client';

import { MeetContext } from '../../contexts/MeetContext';
import { ParticipantPlaceholder } from './ParticipantPlaceholder';

describe('ParticipantPlaceholder', () => {
    const mockParticipant = {
        identity: 'participant-123',
        metadata: '{"profileColor": "profile-background-1", "backgroundColor": "meet-background-1"}',
    } as Participant;

    const defaultContextValue = {
        participantNameMap: {
            'participant-123': 'John Doe',
        },
    };

    const emptyContextValue = {
        participantNameMap: {},
    };

    it('renders loading spinner when participant name is not available', () => {
        render(
            // @ts-expect-error - Only providing participantNameMap
            <MeetContext.Provider value={emptyContextValue}>
                <ParticipantPlaceholder participant={mockParticipant} />
            </MeetContext.Provider>
        );

        expect(screen.getByTestId('circle-loader')).toBeInTheDocument();
    });

    it('renders participant initials when participant name is available', () => {
        render(
            // @ts-expect-error - Only providing participantNameMap
            <MeetContext.Provider value={defaultContextValue}>
                <ParticipantPlaceholder participant={mockParticipant} />
            </MeetContext.Provider>
        );

        expect(screen.getByText('JD')).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('applies correct styling for regular view', () => {
        render(
            // @ts-expect-error - Only providing participantNameMap
            <MeetContext.Provider value={defaultContextValue}>
                <ParticipantPlaceholder participant={mockParticipant} />
            </MeetContext.Provider>
        );

        const initialsContainer = screen.getByText('JD').closest('div');
        expect(initialsContainer).toHaveClass('text-3xl');
        expect(initialsContainer).toHaveClass('radius-normal');
        expect(initialsContainer).toHaveStyle({ '--w-custom': '5rem', '--h-custom': '5rem' });
    });

    it('applies correct styling for small view', () => {
        render(
            // @ts-expect-error - Only providing participantNameMap
            <MeetContext.Provider value={defaultContextValue}>
                <ParticipantPlaceholder participant={mockParticipant} smallView={true} />
            </MeetContext.Provider>
        );

        const initialsContainer = screen.getByText('JD').closest('div');
        expect(initialsContainer).toHaveClass('text-lg');
        expect(initialsContainer).toHaveClass('radius-small');
        expect(initialsContainer).toHaveStyle({ '--w-custom': '4rem', '--h-custom': '4rem' });
    });

    it('renders with correct placeholder container classes', () => {
        render(
            // @ts-expect-error - Only providing participantNameMap
            <MeetContext.Provider value={defaultContextValue}>
                <ParticipantPlaceholder participant={mockParticipant} />
            </MeetContext.Provider>
        );

        const initialsContainer = screen.getByText('JD');

        const container = initialsContainer.closest('.participant-placeholder');

        expect(initialsContainer).toHaveClass('profile-background-1');
        expect(container).toHaveClass('meet-background-1');
    });
});
