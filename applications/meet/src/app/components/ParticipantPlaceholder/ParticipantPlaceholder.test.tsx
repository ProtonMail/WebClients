import { render, screen } from '@testing-library/react';

import { ParticipantPlaceholder } from './ParticipantPlaceholder';

describe('ParticipantPlaceholder', () => {
    const participantName = 'John Doe';
    const backgroundColor = 'meet-background-1';
    const profileColor = 'profile-background-1';

    it('renders loading spinner when participant name is not available', () => {
        render(
            <ParticipantPlaceholder
                participantName={undefined}
                backgroundColor={backgroundColor}
                profileColor={profileColor}
            />
        );

        expect(screen.getByTestId('circle-loader')).toBeInTheDocument();
    });

    it('renders participant initials when participant name is available', () => {
        render(
            <ParticipantPlaceholder
                participantName={participantName}
                backgroundColor={backgroundColor}
                profileColor={profileColor}
            />
        );

        expect(screen.getByText('JD')).toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('applies correct styling for regular view', () => {
        render(
            <ParticipantPlaceholder
                participantName={participantName}
                backgroundColor={backgroundColor}
                profileColor={profileColor}
            />
        );

        const initialsContainer = screen.getByText('JD').closest('div');
        expect(initialsContainer).toHaveClass('text-3xl');
        expect(initialsContainer).toHaveClass('radius-normal');
        expect(initialsContainer).toHaveStyle({ '--w-custom': '5rem', '--h-custom': '5rem' });
    });

    it('applies correct styling for small view', () => {
        render(
            <ParticipantPlaceholder
                participantName={participantName}
                backgroundColor={backgroundColor}
                profileColor={profileColor}
                viewSize="small"
            />
        );

        const initialsContainer = screen.getByText('JD').closest('div');
        expect(initialsContainer).toHaveClass('text-lg');
        expect(initialsContainer).toHaveClass('radius-small');
        expect(initialsContainer).toHaveStyle({ '--w-custom': '2.5rem', '--h-custom': '2.5rem' });
    });

    it('renders with correct placeholder container classes', () => {
        render(
            <ParticipantPlaceholder
                participantName={participantName}
                backgroundColor={backgroundColor}
                profileColor={profileColor}
            />
        );

        const initialsContainer = screen.getByText('JD');

        const container = initialsContainer.closest('.participant-placeholder');

        expect(initialsContainer).toHaveClass('profile-background-1');
        expect(container).toHaveClass('meet-background-1');
    });
});
