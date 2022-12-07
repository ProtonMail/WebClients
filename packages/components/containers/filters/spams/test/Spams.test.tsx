import React from 'react';

import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { clearAll, render } from '@proton/components/containers/contacts/tests/render';

import Spams from '../Spams';
import SpamModal from '../modals/SpamModal';

describe('Spams - Incoming defaults', () => {
    afterEach(() => {
        clearAll();
    });

    // Need to add FF mocks on components Jest side
    it.skip('Should display an empty list', () => {
        render(<Spams />);

        expect(screen.getByRole('button', { name: 'Add address' })).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it.skip('Should display blocked email modal', async () => {
        render(<Spams />);

        fireEvent.click(screen.getByRole('button', { name: 'Add address' }));
        fireEvent.click(screen.getByRole('button', { name: 'Block' }));

        await waitFor(() => screen.getByTestId('spam-modal'));

        expect(screen.getByTestId('spam-modal')).toHaveTextContent('Add to Block List');
    });

    it('Modal submission should return correct values', () => {
        const mockedSubmit = jest.fn();
        const EMAIL = 'homer@simpsons.fr';

        render(
            <SpamModal
                modalProps={{
                    open: true,
                }}
                type="SPAM"
                onAdd={mockedSubmit}
            />
        );

        const emailInputs = screen.getAllByLabelText('Email');
        const emailRadio = emailInputs[0];
        const emailInput = emailInputs[1];

        userEvent.click(emailRadio);
        expect(emailRadio).toBeChecked();

        userEvent.type(emailInput, EMAIL);

        // Dom actually got 2 button called "add address" at this moment. The submit one is the second
        const submitButton = screen.getByRole('button', { name: 'Add address' });
        userEvent.click(submitButton);

        const submitCalls = mockedSubmit.mock.calls.length;
        const submitCallsMode = mockedSubmit.mock.calls[0][0];
        const submitCallsEmail = mockedSubmit.mock.calls[0][1];

        expect(submitCalls).toBe(1);
        expect(submitCallsMode).toBe('email');
        expect(submitCallsEmail).toBe(EMAIL);
    });
});
