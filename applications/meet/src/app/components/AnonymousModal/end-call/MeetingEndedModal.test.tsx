import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useMeetSelector } from '@proton/meet/store/hooks';

import { MeetingEndedModal } from './MeetingEndedModal';

vi.mock('@proton/meet/store/hooks', () => ({ useMeetSelector: vi.fn() }));
vi.mock('./EndCallModalShell', () => ({
    EndCallModalShell: ({ title, subtitle }: { title: string; subtitle: string }) => (
        <>
            <h1>{title}</h1>
            <p>{subtitle}</p>
        </>
    ),
}));

const useMeetSelectorMock = useMeetSelector as unknown as Mock;

const renderWithReason = (reason: unknown) => {
    useMeetSelectorMock.mockReturnValue(reason);
    render(<MeetingEndedModal open onClose={vi.fn()} action={vi.fn()} />);
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
});
