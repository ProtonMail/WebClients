import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useMeetSelector } from '@proton/meet/store/hooks';

import { NewPill } from './NewPill';
import { useNewPill } from './useNewPill';

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: vi.fn(),
}));

const setSignedInUser = (userId: string) => vi.mocked(useMeetSelector).mockReturnValue(userId);

const setGuest = () => vi.mocked(useMeetSelector).mockReturnValue('');

const ButtonWithNewPill = ({ storageKey }: { storageKey: string }) => {
    const { isNew, markNewPillAsRead } = useNewPill(storageKey);

    const button = (
        <button type="button" onClick={markNewPillAsRead}>
            Show options
        </button>
    );

    return isNew ? <NewPill>{button}</NewPill> : button;
};

describe('NewPill', () => {
    it('should display the new label alongside its content', () => {
        render(
            <NewPill>
                <button type="button">Show options</button>
            </NewPill>
        );

        expect(screen.getByText('New')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Show options' })).toBeInTheDocument();
    });

    it('should apply the given class name to the pill', () => {
        render(<NewPill className="custom-pill">Show options</NewPill>);

        expect(screen.getByText('New')).toHaveClass('custom-pill');
    });
});

describe('NewPill with useNewPill', () => {
    beforeEach(() => {
        localStorage.clear();
        setSignedInUser('user-1');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should not display the pill when it was already marked as read', () => {
        localStorage.setItem('user.user-1.newPill.waiting-room-dropdown', 'false');

        render(<ButtonWithNewPill storageKey="waiting-room-dropdown" />);

        expect(screen.queryByText('New')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Show options' })).toBeInTheDocument();
    });

    it('should hide the pill once its content has been clicked', async () => {
        render(<ButtonWithNewPill storageKey="waiting-room-dropdown" />);

        expect(screen.getByText('New')).toBeInTheDocument();

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Show options' }));

        expect(screen.queryByText('New')).not.toBeInTheDocument();
    });

    it('should not display the pill again after a remount', async () => {
        const { unmount } = render(<ButtonWithNewPill storageKey="waiting-room-dropdown" />);

        expect(screen.getByText('New')).toBeInTheDocument();

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Show options' }));
        unmount();

        render(<ButtonWithNewPill storageKey="waiting-room-dropdown" />);

        expect(screen.queryByText('New')).not.toBeInTheDocument();
    });

    it('should hide the pill even when the read state cannot be persisted', async () => {
        vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });

        render(<ButtonWithNewPill storageKey="waiting-room-dropdown" />);

        expect(screen.getByText('New')).toBeInTheDocument();

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Show options' }));

        expect(screen.queryByText('New')).not.toBeInTheDocument();
    });

    it('should keep displaying the pill of a different key', async () => {
        const { unmount } = render(<ButtonWithNewPill storageKey="waiting-room-dropdown" />);

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Show options' }));

        expect(screen.queryByText('New')).not.toBeInTheDocument();

        unmount();

        render(<ButtonWithNewPill storageKey="schedule-meeting-options" />);

        expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should keep displaying the pill for another signed in user', async () => {
        const { unmount } = render(<ButtonWithNewPill storageKey="waiting-room-dropdown" />);

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Show options' }));

        expect(screen.queryByText('New')).not.toBeInTheDocument();

        unmount();
        setSignedInUser('user-2');

        render(<ButtonWithNewPill storageKey="waiting-room-dropdown" />);

        expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should keep displaying the pill for a signed in user once a guest dismissed it', async () => {
        setGuest();

        const { unmount } = render(<ButtonWithNewPill storageKey="waiting-room-dropdown" />);

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Show options' }));

        expect(screen.queryByText('New')).not.toBeInTheDocument();

        unmount();
        setSignedInUser('user-1');

        render(<ButtonWithNewPill storageKey="waiting-room-dropdown" />);

        expect(screen.getByText('New')).toBeInTheDocument();
    });
});
