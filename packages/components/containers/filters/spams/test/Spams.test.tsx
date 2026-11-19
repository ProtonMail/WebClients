import React from 'react';

import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { addApiMock, addApiResolver, apiMock, clearApiMocks } from '@proton/test-api/vitest/api';

import { clearAll, renderWithProviders } from '../../../contacts/tests/vitest/render';
import Spams from '../Spams';
import SpamModal from '../modals/SpamModal';

describe('Spams - Incoming defaults', () => {
    afterEach(() => {
        clearAll();
        clearApiMocks();
    });

    it('Should display an empty list', () => {
        renderWithProviders(<Spams />);

        expect(screen.getByRole('button', { name: 'Add address or domain' })).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('prevents paging through stale results while a search loads', async () => {
        const url = 'mail/v4/incomingdefaults';
        addApiMock(url, () => ({
            IncomingDefaults: [{ ID: 'first', Email: 'first@example.test', Location: 4 }],
            Total: 30,
            GlobalTotal: 30,
        }));
        renderWithProviders(<Spams />);
        expect(await screen.findByTitle('Next')).toBeEnabled();

        const search = addApiResolver(url);
        fireEvent.change(screen.getByPlaceholderText('Search list'), { target: { value: 'unique' } });

        await waitFor(() => expect(screen.getByTitle('Next')).toBeDisabled());
        expect(screen.getByTitle('Open pagination')).toBeDisabled();
        fireEvent.click(screen.getByTitle('Next'));

        await waitFor(() =>
            expect(apiMock).toHaveBeenLastCalledWith(
                expect.objectContaining({ params: expect.objectContaining({ Keyword: 'unique', Page: 0 }) })
            )
        );
        await act(async () => {
            search.resolve({
                IncomingDefaults: [{ ID: 'unique', Email: 'unique@example.test', Location: 4 }],
                Total: 1,
                GlobalTotal: 30,
            });
        });
        expect(screen.getByText('unique@example.test')).toBeInTheDocument();
        expect(screen.queryByTitle('Next')).not.toBeInTheDocument();
    });

    it('makes the previous results usable again when a search fails', async () => {
        const url = 'mail/v4/incomingdefaults';
        addApiMock(url, () => ({
            IncomingDefaults: [{ ID: 'first', Email: 'first@example.test', Location: 4 }],
            Total: 30,
            GlobalTotal: 30,
        }));
        renderWithProviders(<Spams />);
        expect(await screen.findByTitle('Next')).toBeEnabled();

        const search = addApiResolver(url);
        fireEvent.change(screen.getByPlaceholderText('Search list'), { target: { value: 'unique' } });
        await waitFor(() => expect(screen.getByTitle('Next')).toBeDisabled());

        await waitFor(() =>
            expect(apiMock).toHaveBeenLastCalledWith(
                expect.objectContaining({ params: expect.objectContaining({ Keyword: 'unique' }) })
            )
        );
        await act(async () => {
            search.reject(new Error('Search failed'));
        });

        expect(screen.getByTitle('Next')).toBeEnabled();
        expect(screen.getByText('first@example.test')).toBeInTheDocument();
        expect(screen.getByRole('table').closest('[aria-busy]')).toHaveAttribute('aria-busy', 'false');
    });

    it('Should display blocked email modal', async () => {
        renderWithProviders(<Spams />);

        fireEvent.click(screen.getByRole('button', { name: 'Add address or domain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Block' }));

        const modal = await screen.findByTestId('spam-modal');

        expect(modal).toHaveTextContent('Add to block list');
    });

    it('Should display blocked email modal with organization', async () => {
        renderWithProviders(<Spams isOrganization />);

        fireEvent.click(screen.getByRole('button', { name: 'Add address or domain' }));
        fireEvent.click(screen.getByRole('button', { name: 'Block' }));

        const modal = await screen.findByTestId('spam-modal');

        expect(modal).toHaveTextContent('Add to block list');
    });

    it('Modal submission should return correct values', async () => {
        const mockedSubmit = vi.fn();
        const EMAIL = 'homer@simpsons.fr';

        renderWithProviders(
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
