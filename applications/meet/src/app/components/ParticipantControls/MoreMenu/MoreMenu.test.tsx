import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { IcBug } from '@proton/icons/icons/IcBug';

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
        render(<MoreMenu variant="sheet" />);

        openMenu();
        expect(sheet()).toHaveFocus();

        fireEvent.keyDown(sheet(), { key: 'Escape' });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(moreOptionsButton()).toHaveFocus();
    });

    it('gives focus back to More options when the Close button closes it', () => {
        render(<MoreMenu variant="sheet" />);

        openMenu();
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(moreOptionsButton()).toHaveFocus();
    });

    it('gives focus back to More options when the window narrows to the sheet while the popup is open', () => {
        const { rerender } = render(<MoreMenu variant="popup" />);
        openMenu();
        act(() => screen.getByRole('button', { name: 'Popup item' }).focus());

        rerender(<MoreMenu variant="sheet" />);
        fireEvent.keyDown(sheet(), { key: 'Escape' });

        expect(moreOptionsButton()).toHaveFocus();
    });

    it('shows no debug rows by default', () => {
        render(<MoreMenu variant="sheet" />);

        openMenu();

        expect(screen.queryByRole('button', { name: 'Debug overlay' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Meeting debug' })).not.toBeInTheDocument();
    });

    it('shows the debug rows it is given as its last rows', () => {
        const debugActions = [
            { id: 'debug-overlay', Icon: IcBug, label: 'Debug overlay', onClick: vi.fn() },
            { id: 'meeting-debug', Icon: IcBug, label: 'Meeting debug', onClick: vi.fn() },
        ];
        render(<MoreMenu variant="sheet" debugActions={debugActions} />);

        openMenu();

        const rowNames = within(sheet())
            .getAllByRole('button')
            .map((button) => button.textContent);
        expect(rowNames.slice(-2)).toEqual(['Debug overlay', 'Meeting debug']);
    });
});
