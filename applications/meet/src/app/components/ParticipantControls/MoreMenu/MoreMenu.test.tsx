import { act, fireEvent, render, screen } from '@testing-library/react';

import { MoreMenu } from './MoreMenu';

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetDispatch: () => vi.fn(),
    useMeetSelector: () => undefined,
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: () => false,
}));

vi.mock('@proton/components/hooks/useActiveBreakpoint', () => ({
    default: () => ({ viewportWidth: {} }),
}));

vi.mock('../../RecordingControls/useRecordingToggle', () => ({
    useRecordingToggle: () => ({ isVisible: false }),
}));

vi.mock('../../Settings/useLiveCaptionsToggle', () => ({
    useLiveCaptionsToggle: () => ({}),
}));

vi.mock('../../../hooks/useHelpAndFeedback', () => ({
    useHelpAndFeedback: () => ({}),
}));

vi.mock('../../ParticipantsLayout/LayoutSelector/useLayoutOptions', () => ({
    useLayoutOptions: () => ({ options: [] }),
}));

vi.mock('../../MeetingReadyPopup/MeetingReadyPopup', () => ({
    MeetingReadyPopup: () => null,
}));

vi.mock('./MoreMenuPopup', () => ({
    MoreMenuPopup: ({ isOpen }: { isOpen: boolean }) => isOpen && <button type="button">Popup item</button>,
}));

vi.mock('./useMeetingActions', () => ({
    useMeetingActions: () => ({}),
}));

vi.mock('../../../hooks/bridges/useEmojiReaction', () => ({
    useEmojiReaction: () => vi.fn(),
    useAvailableEmojiReactions: () => [],
}));

const moreOptionsButton = () => screen.getByRole('button', { name: 'More options' });
const openMenu = () => {
    act(() => moreOptionsButton().focus());
    fireEvent.click(moreOptionsButton());
};
const sheet = () => screen.getByRole('dialog', { name: 'More options' });

describe('MoreMenu sheet', () => {
    it('gives focus back to More options when Escape closes it', () => {
        render(<MoreMenu variant="sheet" onOpenMeetingDebug={vi.fn()} />);

        openMenu();
        expect(sheet()).toHaveFocus();

        fireEvent.keyDown(sheet(), { key: 'Escape' });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(moreOptionsButton()).toHaveFocus();
    });

    it('gives focus back to More options when the Close button closes it', () => {
        render(<MoreMenu variant="sheet" onOpenMeetingDebug={vi.fn()} />);

        openMenu();
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(moreOptionsButton()).toHaveFocus();
    });

    it('gives focus back to More options when the window narrows to the sheet while the popup is open', () => {
        const { rerender } = render(<MoreMenu variant="popup" onOpenMeetingDebug={vi.fn()} />);
        openMenu();
        act(() => screen.getByRole('button', { name: 'Popup item' }).focus());

        rerender(<MoreMenu variant="sheet" onOpenMeetingDebug={vi.fn()} />);
        fireEvent.keyDown(sheet(), { key: 'Escape' });

        expect(moreOptionsButton()).toHaveFocus();
    });
});
