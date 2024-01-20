import { fireEvent, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import { headers } from '@proton/activation/msw.header';
import { easySwitchRender } from '@proton/activation/src/tests/render';

import ImapMailModal from './ImapMailModal';

const server = setupServer();

beforeAll(() => {
    server.listen();
});
afterEach(() => server.resetHandlers());
afterAll(() => {
    server.close();
});

describe('IMAP Start Step', () => {
    it('Should render an empty form and fill server when email filled', async () => {
        easySwitchRender(<ImapMailModal />);
        const emailInput = screen.getByTestId('StepForm:emailInput');
        const passwordInput = screen.getByTestId('StepForm:passwordInput');
        const serverInput = screen.getByTestId('StepForm:serverInput');
        const portInput = screen.getByTestId('StepForm:portInput');

        const submitButton = screen.getByTestId('StepForm:submitButton');

        fireEvent.change(emailInput, { target: { value: 'testing@proton.ch' } });

        server.use(
            http.get('/importer/v1/mail/importers/authinfo', () => {
                return HttpResponse.json(
                    {
                        Authentication: {
                            ImapHost: 'imap.proton.ch',
                            ImapPort: 993,
                        },
                    },
                    { headers }
                );
            })
        );

        await waitFor(() => expect(serverInput).toHaveValue('imap.proton.ch'));
        expect(portInput).toHaveValue('993');

        expect(submitButton).toBeDisabled();
        fireEvent.change(passwordInput, { target: { value: 'password' } });
        await waitFor(() => expect(submitButton).toBeEnabled());

        // Change server and port if there is an issue
        fireEvent.change(serverInput, { target: { value: 'imap.proton.me' } });
        expect(serverInput).toHaveValue('imap.proton.me');

        fireEvent.change(portInput, { target: { value: '995' } });
        expect(portInput).toHaveValue('995');
    });
});
