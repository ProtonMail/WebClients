import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { openNewTab } from '@proton/shared/lib/helpers/browser';

import { E2eeUnsupportedPage } from './E2eeUnsupportedPage';

vi.mock('@proton/shared/lib/helpers/browser', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    openNewTab: vi.fn(),
}));
vi.mock('../PageHeader/PageHeader', () => ({ PageHeader: () => null }));

beforeAll(() => {
    const style = document.createElement('style');
    style.textContent = 'dialog { display: block; }';
    document.head.appendChild(style);
});

describe('E2eeUnsupportedPage', () => {
    it('explains that this browser cannot join, with the exact copy', () => {
        render(<E2eeUnsupportedPage />);

        const dialog = screen.getByRole('dialog', { name: 'Can’t join from this browser' });
        expect(dialog).toHaveAccessibleDescription(
            expect.stringContaining(
                'This browser doesn’t support the end-to-end encryption Proton Meet uses to protect every meeting.'
            )
        );
        expect(dialog).toHaveAccessibleDescription(
            expect.stringContaining('To join, use a different browser or device, or the Proton Meet app on your phone.')
        );
    });

    it('offers only Learn more, which opens the recommended browsers page in a new tab', async () => {
        render(<E2eeUnsupportedPage />);

        const buttons = within(screen.getByRole('dialog')).getAllByRole('button');
        expect(buttons).toHaveLength(1);
        expect(buttons[0]).toHaveAccessibleName('Learn more');

        await userEvent.click(buttons[0]);

        expect(openNewTab).toHaveBeenCalledWith('https://proton.me/support/recommended-browsers');
    });

    it('stays open on Escape', async () => {
        render(<E2eeUnsupportedPage />);

        await userEvent.keyboard('{Escape}');

        expect(screen.getByRole('dialog', { name: 'Can’t join from this browser' })).toBeInTheDocument();
    });

    it('shows no way to join the call', () => {
        render(<E2eeUnsupportedPage />);

        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /join/i })).not.toBeInTheDocument();
    });
});
