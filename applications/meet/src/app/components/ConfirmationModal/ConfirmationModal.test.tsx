import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmationModal } from './ConfirmationModal';

// ModalTwo renders <dialog> without `open` and shows it through the app's CSS, which happy-dom does not load,
// so happy-dom's default `display: none` for a <dialog> without `open` would hide it from role queries.
beforeAll(() => {
    const style = document.createElement('style');
    style.textContent = 'dialog { display: block; }';
    document.head.appendChild(style);
});

const renderModal = ({ onClose, showCloseButton }: { onClose: () => void; showCloseButton?: boolean }) =>
    render(
        <ConfirmationModal
            title="Leave meeting?"
            primaryText="Leave"
            onPrimaryAction={vi.fn()}
            onClose={onClose}
            showCloseButton={showCloseButton}
        />
    );

describe('ConfirmationModal', () => {
    it('shows a close button that calls onClose by default', async () => {
        const onClose = vi.fn();
        renderModal({ onClose });

        await userEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('hides the close button but still closes on Escape when showCloseButton is false', async () => {
        const onClose = vi.fn();
        renderModal({ onClose, showCloseButton: false });

        expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();

        await userEvent.keyboard('{Escape}');

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
