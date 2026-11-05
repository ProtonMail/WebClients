import { render, screen, within } from '@testing-library/react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectInstantMeeting, selectMaxParticipants } from '@proton/meet/store/slices/currentMeeting';
import { selectIsLocalParticipantAdminOrHost } from '@proton/meet/store/slices/participants/participantsSlice';
import { selectTotalParticipantCount } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { selectSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest, selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';

import { ParticipantsButton } from './ParticipantsButton';

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: vi.fn(),
    useMeetDispatch: () => vi.fn(),
}));

const renderAsHost = ({
    totalParticipantCount,
    maxParticipants = 10,
}: {
    totalParticipantCount: number;
    maxParticipants?: number;
}) => {
    const selectedValues = new Map<unknown, unknown>([
        [selectIsGuest, false],
        [selectInstantMeeting, false],
        [selectMaxParticipants, maxParticipants],
        [selectTotalParticipantCount, totalParticipantCount],
        [selectIsLocalParticipantAdminOrHost, true],
        [selectSubscriptionStatus, { isPaidUser: true }],
        [selectSideBarState, {}],
    ]);
    vi.mocked(useMeetSelector).mockImplementation((selector) => selectedValues.get(selector));

    render(<ParticipantsButton />);

    return screen.getByRole('button', { name: 'Toggle participants' });
};

describe('ParticipantsButton', () => {
    it('describes a full meeting to assistive technology', () => {
        expect(renderAsHost({ totalParticipantCount: 10 })).toHaveAccessibleDescription('Meeting full');
    });

    it('describes an almost full meeting to assistive technology', () => {
        expect(renderAsHost({ totalParticipantCount: 9 })).toHaveAccessibleDescription('Meeting almost full');
    });

    it('has no capacity description when the meeting has room', () => {
        expect(renderAsHost({ totalParticipantCount: 5 })).toHaveAccessibleDescription('');
    });

    it('shows no capacity status when the meeting has no participant limit', () => {
        const button = renderAsHost({ totalParticipantCount: 3, maxParticipants: 0 });

        expect(button).toHaveAccessibleDescription('');
        expect(within(button).getByText('3')).not.toHaveClass('indicator-danger');
    });
});
