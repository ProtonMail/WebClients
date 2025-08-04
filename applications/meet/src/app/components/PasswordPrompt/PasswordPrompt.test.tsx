import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PasswordPrompt } from './PasswordPrompt';

describe('PasswordPrompt', () => {
    const mockPassword = '123456';

    it('should allow for submitting the password', async () => {
        const onPasswordSubmit = vi.fn();

        render(
            <PasswordPrompt
                password={mockPassword}
                setPassword={() => {}}
                onPasswordSubmit={onPasswordSubmit}
                invalidPassphrase={false}
            />
        );

        const user = userEvent.setup();

        const passwordInput = screen.getByLabelText('Passphrase');

        expect(passwordInput).toHaveValue(mockPassword);

        const submitButton = screen.getByText('Continue');
        await user.click(submitButton);

        expect(onPasswordSubmit).toHaveBeenCalled();
    });

    it('should show an error message if the password is incorrect', async () => {
        const onPasswordSubmit = vi.fn();

        render(
            <PasswordPrompt
                password={mockPassword}
                setPassword={() => {}}
                onPasswordSubmit={onPasswordSubmit}
                invalidPassphrase={true}
            />
        );

        expect(screen.getByText('Invalid passphrase')).toBeInTheDocument();
    });
});
