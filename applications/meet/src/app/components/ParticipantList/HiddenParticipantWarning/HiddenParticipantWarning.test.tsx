import { fireEvent, render, screen } from '@testing-library/react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectHiddenParticipantCount } from '@proton/meet/store/slices/participantCountMismatchListener';
import {
    MeetingSideBars,
    openSideBar,
    selectParticipantCountMismatchSince,
} from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { MINUTE } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { HiddenParticipantWarning } from './HiddenParticipantWarning';

const dispatch = vi.fn();

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: vi.fn(),
    useMeetDispatch: () => dispatch,
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

const renderWarning = ({
    hiddenParticipantCount,
    isHiddenParticipantWarningEnabled = true,
}: {
    hiddenParticipantCount: number;
    isHiddenParticipantWarningEnabled?: boolean;
}) => {
    const selectedValues = new Map<unknown, unknown>([
        [selectIsGuest, false],
        [selectHiddenParticipantCount, hiddenParticipantCount],
        [selectParticipantCountMismatchSince, hiddenParticipantCount ? Date.now() - MINUTE : null],
    ]);
    vi.mocked(useMeetSelector).mockImplementation((selector) => selectedValues.get(selector));
    vi.mocked(useFlag).mockImplementation(
        (flag) =>
            flag === 'MeetParticipantCountMismatch' ||
            (flag === 'MeetHiddenParticipantWarning' && isHiddenParticipantWarningEnabled)
    );

    return render(<HiddenParticipantWarning />);
};

describe('HiddenParticipantWarning', () => {
    beforeEach(() => {
        dispatch.mockClear();
    });

    it('says one person has access but is not in the call', () => {
        renderWarning({ hiddenParticipantCount: 1 });

        expect(screen.getByText("1 person has access but isn't in the call")).toBeVisible();
        expect(screen.getByText('This usually means a lost connection. It should clear on its own.')).toBeVisible();
    });

    it('says how many people have access but are not in the call', () => {
        renderWarning({ hiddenParticipantCount: 3 });

        expect(screen.getByText("3 people have access but aren't in the call")).toBeVisible();
    });

    it('opens Meeting details from "View security details" and offers no way to close the row', () => {
        renderWarning({ hiddenParticipantCount: 2 });

        expect(screen.getAllByRole('button')).toHaveLength(1);

        fireEvent.click(screen.getByRole('button', { name: 'View security details' }));

        expect(dispatch).toHaveBeenCalledWith(openSideBar(MeetingSideBars.MeetingDetails));
    });

    it('renders nothing while nobody is hidden', () => {
        const { container } = renderWarning({ hiddenParticipantCount: 0 });

        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when the flag is off', () => {
        const { container } = renderWarning({ hiddenParticipantCount: 2, isHiddenParticipantWarningEnabled: false });

        expect(container).toBeEmptyDOMElement();
    });
});
