import { render, screen, within } from '@testing-library/react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectInstantMeeting, selectMaxParticipants } from '@proton/meet/store/slices/currentMeeting';
import { selectHiddenParticipantCount } from '@proton/meet/store/slices/participantCountMismatchListener';
import { selectIsLocalParticipantAdminOrHost } from '@proton/meet/store/slices/participants/participantsSlice';
import { selectTotalParticipantCount } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { selectParticipantCountMismatchSince, selectSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest, selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';
import { MINUTE } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { ParticipantsButton } from './ParticipantsButton';

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: vi.fn(),
    useMeetDispatch: () => vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

const renderAsHost = ({
    totalParticipantCount,
    maxParticipants = 10,
    hiddenParticipantCount = 0,
    isHiddenParticipantWarningEnabled = true,
}: {
    totalParticipantCount: number;
    maxParticipants?: number;
    hiddenParticipantCount?: number;
    isHiddenParticipantWarningEnabled?: boolean;
}) => {
    const selectedValues = new Map<unknown, unknown>([
        [selectIsGuest, false],
        [selectInstantMeeting, false],
        [selectMaxParticipants, maxParticipants],
        [selectTotalParticipantCount, totalParticipantCount],
        [selectIsLocalParticipantAdminOrHost, true],
        [selectSubscriptionStatus, { isPaidUser: true }],
        [selectSideBarState, {}],
        [selectHiddenParticipantCount, hiddenParticipantCount],
        [selectParticipantCountMismatchSince, hiddenParticipantCount ? Date.now() - MINUTE : null],
    ]);
    vi.mocked(useMeetSelector).mockImplementation((selector) => selectedValues.get(selector));
    vi.mocked(useFlag).mockImplementation(
        (flag) =>
            flag === 'MeetParticipantCountMismatch' ||
            (flag === 'MeetHiddenParticipantWarning' && isHiddenParticipantWarningEnabled)
    );

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

    describe('hidden participant warning', () => {
        it('shows the count followed by "!" in the warning style and describes who is missing', () => {
            const button = renderAsHost({ totalParticipantCount: 2, hiddenParticipantCount: 1 });
            const indicator = within(button).getByText('2');

            expect(indicator.textContent).toBe('2 !');
            expect(indicator.closest('.indicator')).toHaveClass('indicator-warning');
            expect(button).toHaveAccessibleDescription("1 person has access but isn't in the call");
        });

        it.each([
            { totalParticipantCount: 9, capacityLabel: 'Meeting almost full' },
            { totalParticipantCount: 10, capacityLabel: 'Meeting full' },
        ])(
            'replaces the capacity color with the warning style at $totalParticipantCount of 10 and keeps "$capacityLabel" in the description',
            ({ totalParticipantCount, capacityLabel }) => {
                const button = renderAsHost({ totalParticipantCount, hiddenParticipantCount: 3 });
                const indicator = within(button).getByText(String(totalParticipantCount)).closest('.indicator');

                expect(indicator).toHaveClass('indicator-warning');
                expect(indicator).not.toHaveClass('indicator-danger');
                expect(button).toHaveAccessibleDescription(
                    `3 people have access but aren't in the call. ${capacityLabel}`
                );
            }
        );

        it('shows the plain count when the flag is off', () => {
            const button = renderAsHost({
                totalParticipantCount: 2,
                hiddenParticipantCount: 1,
                isHiddenParticipantWarningEnabled: false,
            });

            expect(within(button).getByText('2').textContent).toBe('2');
            expect(button).toHaveAccessibleDescription('');
        });
    });
});
