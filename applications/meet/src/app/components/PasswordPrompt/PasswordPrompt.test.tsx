import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PasswordPrompt } from './PasswordPrompt';

describe('PasswordPrompt', () => {
    it('should allow for submitting the password', async () => {
        const onPasswordSubmit = vi.fn();

        const mockPassword = '123456';

        render(<PasswordPrompt password={mockPassword} setPassword={() => {}} onPasswordSubmit={onPasswordSubmit} />);

        const user = userEvent.setup();

        const passwordInput = screen.getByLabelText('Password');

        expect(passwordInput).toHaveValue(mockPassword);

        const submitButton = screen.getByText('Continue');
        await user.click(submitButton);

        expect(onPasswordSubmit).toHaveBeenCalled();
    });
});
