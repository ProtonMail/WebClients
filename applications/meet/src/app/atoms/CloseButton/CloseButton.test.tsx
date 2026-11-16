import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CloseButton } from './CloseButton';

describe('CloseButton', () => {
    it('is named Close', () => {
        render(<CloseButton onClose={vi.fn()} />);

        expect(screen.getByRole('button')).toHaveAccessibleName('Close');
    });

    it('calls onClose on click', async () => {
        const onClose = vi.fn();
        render(<CloseButton onClose={onClose} />);

        await userEvent.setup().click(screen.getByRole('button', { name: 'Close' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['Enter', '{Enter}'],
        ['Space', ' '],
    ])('calls onClose on %s', async (_key, keys) => {
        const onClose = vi.fn();
        render(<CloseButton onClose={onClose} />);
        const user = userEvent.setup();

        await user.tab();
        await user.keyboard(keys);

        expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
