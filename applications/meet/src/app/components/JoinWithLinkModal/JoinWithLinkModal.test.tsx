import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { JoinWithLinkModal } from './JoinWithLinkModal';

// ModalTwo renders <dialog> without `open` and shows it through the app's CSS, which happy-dom does not load,
// so happy-dom's default `display: none` for a <dialog> without `open` would hide it from role queries.
beforeAll(() => {
    const style = document.createElement('style');
    style.textContent = 'dialog { display: block; }';
    document.head.appendChild(style);
});

const renderModal = () => {
    render(<JoinWithLinkModal open onClose={vi.fn()} onJoin={vi.fn()} />);
    return screen.getByRole('textbox', { name: 'Meeting link' });
};

describe('JoinWithLinkModal', () => {
    it('describes the field with the error until the full link is pasted', async () => {
        const input = renderModal();

        await userEvent.type(input, 'https://meet.proton.me/join/id-abcdefghij');

        expect(input).toHaveAccessibleDescription('Paste the full meeting link');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(screen.queryByText('Invalid meeting link')).not.toBeInTheDocument();

        await userEvent.type(input, '#pwd-abcdefghijkl');

        expect(input).toHaveAccessibleDescription('');
        expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('shows no error while the field is empty', () => {
        const input = renderModal();

        expect(input).toHaveAccessibleDescription('');
        expect(input).toHaveAttribute('aria-invalid', 'false');
    });
});
