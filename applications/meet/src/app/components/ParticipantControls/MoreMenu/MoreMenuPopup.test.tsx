import { createRef } from 'react';

import { render, screen } from '@testing-library/react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectInstantMeeting, selectMaxParticipants } from '@proton/meet/store/slices/currentMeeting';
import { selectHiddenParticipantCount } from '@proton/meet/store/slices/participantCountMismatchListener';
import { selectIsLocalParticipantAdminOrHost } from '@proton/meet/store/slices/participants/participantsSlice';
import { selectTotalParticipantCount } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { selectParticipantCountMismatch } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { MINUTE } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { MoreMenuPopup } from './MoreMenuPopup';

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: vi.fn(),
    useMeetDispatch: () => vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

vi.mock('./useMeetingActions', () => ({
    useMeetingActions: () => ({
        participants: { id: 'participants', Icon: () => null, label: 'Participants', onClick: vi.fn() },
        raiseHand: { id: 'raise-hand', Icon: () => null, label: 'Raise hand', onClick: vi.fn() },
    }),
}));

vi.mock('../../../hooks/bridges/useEmojiReaction', () => ({
    useEmojiReaction: () => vi.fn(),
    useAvailableEmojiReactions: () => [],
}));

const renderPopup = ({ hiddenParticipantCount }: { hiddenParticipantCount: number }) => {
    const selectedValues = new Map<unknown, unknown>([
        [selectIsGuest, false],
        [selectInstantMeeting, false],
        [selectMaxParticipants, 0],
        [selectTotalParticipantCount, 2],
        [selectIsLocalParticipantAdminOrHost, false],
        [selectHiddenParticipantCount, hiddenParticipantCount],
        [
            selectParticipantCountMismatch,
            hiddenParticipantCount ? { since: Date.now() - MINUTE, isHostInCall: true } : null,
        ],
    ]);
    vi.mocked(useMeetSelector).mockImplementation((selector) => selectedValues.get(selector));
    vi.mocked(useFlag).mockImplementation(
        (flag) => flag === 'MeetParticipantCountMismatch' || flag === 'MeetHiddenParticipantWarning'
    );

    render(
        <MoreMenuPopup
            isOpen
            anchorRef={createRef<HTMLButtonElement>()}
            onClose={vi.fn()}
            toggles={[]}
            actions={[]}
            showMeetingActions
        />
    );
};

describe('MoreMenuPopup', () => {
    it('names the participants item with the count and who is missing, without the "!" mark', () => {
        renderPopup({ hiddenParticipantCount: 1 });

        expect(
            screen.getByRole('button', { name: /^Participants 2 1 person has access but isn't in the call$/ })
        ).toBeVisible();
    });

    it('names the participants item with the plain count without the warning', () => {
        renderPopup({ hiddenParticipantCount: 0 });

        expect(screen.getByRole('button', { name: 'Participants 2' })).toBeVisible();
    });
});
