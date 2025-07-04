import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PasswordPrompt } from './PasswordPrompt';

describe('PasswordPrompt', () => {
    it('should allow for submitting the password', async () => {
        const onPasswordSubmit = vi.fn();

        const mockPassword = '123456';

        render(<PasswordPrompt onPasswordSubmit={onPasswordSubmit} />);

        const passwordInput = screen.getByLabelText('Password');

        const user = userEvent.setup();

        await user.type(passwordInput, mockPassword);

        const submitButton = screen.getByText('Continue');
        await user.click(submitButton);

        expect(onPasswordSubmit).toHaveBeenCalledWith(mockPassword);
    });
});
