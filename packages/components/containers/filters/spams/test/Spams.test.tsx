import React from 'react';

import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { clearAll, render } from '@proton/components/containers/contacts/tests/render';

import Spams from '../Spams';
import SpamModal from '../modals/SpamModal';

describe('Spams - Incoming defaults', () => {
    afterEach(() => {
        clearAll();
    });

    it('Should display an empty list', () => {
        render(<Spams />);

        expect(screen.getByRole('button', { name: 'Add address or domain' })).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('Should display blocked email modal', async () => {
        render(<Spams />);

        fireEvent.click(screen.getByRole('button', { name: 'Add address or domain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Block' }));

        const modal = await screen.findByTestId('spam-modal');

        expect(modal).toHaveTextContent('Add to block list');
    });

    it('Should display blocked email modal with organization', async () => {
        render(<Spams isOrganization />);

        fireEvent.click(screen.getByRole('button', { name: 'Add address or domain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Block' }));

        const modal = await screen.findByTestId('spam-modal');

        expect(modal).toHaveTextContent('Add to block list');
    });

    it('Modal submission should return correct values', async () => {
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

        await userEvent.click(emailRadio);
        expect(emailRadio).toBeChecked();

        await userEvent.type(emailInput, EMAIL);

        // Dom actually got 2 button called "add address" at this moment. The submit one is the second
        const submitButton = screen.getByRole('button', { name: 'Add address' });
        await userEvent.click(submitButton);

        const submitCalls = mockedSubmit.mock.calls.length;
        const submitCallsMode = mockedSubmit.mock.calls[0][0];
        const submitCallsEmail = mockedSubmit.mock.calls[0][1];

        expect(submitCalls).toBe(1);
        expect(submitCallsMode).toBe('email');
        expect(submitCallsEmail).toBe(EMAIL);
    });
});
