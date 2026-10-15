import { render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useMeetSelector } from '@proton/meet/store/hooks';

import { LeftMeetingTitle } from './LeftMeetingTitle';

vi.mock('@proton/meet/store/hooks', () => ({ useMeetSelector: vi.fn() }));

const useMeetSelectorMock = useMeetSelector as unknown as Mock;

const renderWithMeetingName = (meetingName: string) => {
    useMeetSelectorMock.mockReturnValue(meetingName);
    render(<LeftMeetingTitle />);
};

describe('LeftMeetingTitle', () => {
    it('names the meeting the user left', () => {
        renderWithMeetingName('Design Weekly');

        expect(screen.getByText('You left Design Weekly')).toBeInTheDocument();
    });

    it('falls back to a generic title when the meeting has no name', () => {
        renderWithMeetingName('');

        expect(screen.getByText('You left the meeting')).toBeInTheDocument();
    });
});
