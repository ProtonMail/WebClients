import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MeetingLockedModal } from './MeetingLockedModal';

const mocks = vi.hoisted(() => ({
    isMobile: vi.fn(() => false),
}));

vi.mock('@proton/shared/lib/helpers/browser', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    isMobile: mocks.isMobile,
}));

beforeAll(() => {
    const style = document.createElement('style');
    style.textContent = 'dialog { display: block; }';
    document.head.appendChild(style);
});

describe('MeetingLockedModal', () => {
    it('names the dialog by its title and describes it with how to join', () => {
        render(<MeetingLockedModal onClose={vi.fn()} />);

        expect(screen.getByRole('dialog', { name: 'Meeting locked' })).toHaveAccessibleDescription(
            'Ask the host to unlock it so you can join.'
        );
    });

    it('offers a single Close action in the secondary style that calls onClose once', async () => {
        const onClose = vi.fn();
        render(<MeetingLockedModal onClose={onClose} />);

        const dialog = screen.getByRole('dialog', { name: 'Meeting locked' });
        const closeAction = within(dialog).getByRole('button', { name: 'Close' });

        expect(within(dialog).getAllByRole('button')).toEqual([closeAction]);
        expect(closeAction).toHaveClass('secondary');

        await userEvent.click(closeAction);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose once on Escape', async () => {
        const onClose = vi.fn();
        render(<MeetingLockedModal onClose={onClose} />);

        await userEvent.keyboard('{Escape}');

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows the lock at 7.5rem on phones too', () => {
        mocks.isMobile.mockReturnValue(true);
        render(<MeetingLockedModal onClose={vi.fn()} />);

        const lock = within(screen.getByRole('dialog', { name: 'Meeting locked' })).getByRole('presentation');

        expect(lock.style.getPropertyValue('--w-custom')).toBe('7.5rem');
        expect(lock.style.getPropertyValue('--h-custom')).toBe('7.5rem');
    });
});
