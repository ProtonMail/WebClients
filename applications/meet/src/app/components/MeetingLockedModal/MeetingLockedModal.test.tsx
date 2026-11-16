import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MeetingLockedModal } from './MeetingLockedModal';

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

    it('calls onClose once when the Close action is clicked', async () => {
        const onClose = vi.fn();
        render(<MeetingLockedModal onClose={onClose} />);

        const closeAction = screen
            .getAllByRole('button', { name: 'Close' })
            .find((button) => button.textContent === 'Close');
        await userEvent.click(closeAction!);

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
