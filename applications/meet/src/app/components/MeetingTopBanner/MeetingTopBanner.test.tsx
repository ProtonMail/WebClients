import { render, screen } from '@testing-library/react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectHiddenParticipantCount } from '@proton/meet/store/slices/participantCountMismatchListener';
import {
    selectIsRecordingInProgress,
    selectRecordingParticipantNames,
} from '@proton/meet/store/slices/recordingStatusSlice';
import {
    selectParticipantCountMismatchBannerDismissed,
    selectParticipantCountMismatchSince,
} from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { selectWaitingParticipantsCount } from '@proton/meet/store/slices/waitingRoomSlice';
import { MINUTE } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { MeetingTopBanner } from './MeetingTopBanner';

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: vi.fn(),
    useMeetDispatch: () => vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

const renderDuringMismatchWarning = ({
    isHiddenParticipantWarningEnabled,
    hiddenParticipantCount = 2,
    isRecordingInProgress = false,
}: {
    isHiddenParticipantWarningEnabled: boolean;
    hiddenParticipantCount?: number;
    isRecordingInProgress?: boolean;
}) => {
    const selectedValues = new Map<unknown, unknown>([
        [selectIsGuest, false],
        [selectIsRecordingInProgress, isRecordingInProgress],
        [selectRecordingParticipantNames, ['Alice']],
        [selectWaitingParticipantsCount, 0],
        [selectParticipantCountMismatchBannerDismissed, false],
        [selectParticipantCountMismatchSince, Date.now() - MINUTE],
        [selectHiddenParticipantCount, hiddenParticipantCount],
    ]);
    vi.mocked(useMeetSelector).mockImplementation((selector) => selectedValues.get(selector));
    vi.mocked(useFlag).mockImplementation(
        (flag) =>
            flag === 'MeetParticipantCountMismatch' ||
            (flag === 'MeetHiddenParticipantWarning' && isHiddenParticipantWarningEnabled)
    );

    render(<MeetingTopBanner />);
};

describe('MeetingTopBanner', () => {
    it('shows the participant count mismatch banner when the hidden participant warning flag is off', () => {
        renderDuringMismatchWarning({ isHiddenParticipantWarningEnabled: false });

        expect(screen.getByText('Participant counts don’t match')).toBeVisible();
        expect(screen.getByRole('button', { name: 'View security details' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Close this banner' })).toBeVisible();
    });

    it('shows no banner for the mismatch while the hidden participant warning shows', () => {
        renderDuringMismatchWarning({ isHiddenParticipantWarningEnabled: true });

        expect(screen.queryByText('Participant counts don’t match')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'View security details' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Close this banner' })).not.toBeInTheDocument();
    });

    it('keeps the banner when more participants are connected than MLS members, with the hidden participant warning flag on', () => {
        renderDuringMismatchWarning({ isHiddenParticipantWarningEnabled: true, hiddenParticipantCount: 0 });

        expect(screen.getByText('Participant counts don’t match')).toBeVisible();
        expect(screen.getByRole('button', { name: 'View security details' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Close this banner' })).toBeVisible();
    });

    it('keeps the recording banner, without the mismatch, while the hidden participant warning shows', () => {
        renderDuringMismatchWarning({ isHiddenParticipantWarningEnabled: true, isRecordingInProgress: true });

        expect(screen.getByText('Recording in progress · Alice is recording')).toBeVisible();
        expect(screen.queryByText('Participant counts don’t match')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Close this banner' })).not.toBeInTheDocument();
    });
});
