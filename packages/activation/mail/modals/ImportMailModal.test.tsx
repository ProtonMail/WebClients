import { fireEvent, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { ImportType, NormalizedImporter } from '@proton/activation/interface';
import { easySwitchRender } from '@proton/activation/tests/render';
import { Address } from '@proton/shared/lib/interfaces';

import ImportMailModal from './ImportMailModal';

const server = setupServer();

export const ADDRESSES = [
    {
        DisplayName: 'Guillaume',
        ID: '1234',
        Email: 'guillaume@guillaume.fr',
    },
] as Address[];

beforeAll(() => {
    server.listen();
});
afterEach(() => server.resetHandlers());
afterAll(() => {
    server.close();
});

describe('IMAP modal start step', () => {
    it('It should display the start step with an empty form', async () => {
        easySwitchRender(<ImportMailModal addresses={ADDRESSES} />);

        const emailLabel = screen.getByLabelText('Email');
        const passwordLabel = screen.getByLabelText('Password');
        const serverLabel = screen.getByLabelText('Mail Server (IMAP)');
        const portLabel = screen.getByLabelText('Port');
        const submitButton = screen.getByTestId('submit');

        expect(emailLabel).toBeVisible();
        expect(passwordLabel).toBeVisible();
        expect(serverLabel).toBeVisible();
        expect(portLabel).toBeVisible();
        expect(submitButton).toBeVisible();
        expect(submitButton).toBeDisabled();

        fireEvent.change(emailLabel, { target: { value: 'toto@toto.fr' } });

        expect(emailLabel.getAttribute('value')).toContain('toto@toto.fr');

        const apiCallSpy = jest.fn();
        server.use(
            rest.get('/importer/v1/mail/importers/authinfo', (req, res, ctx) => {
                apiCallSpy();
                return res(
                    ctx.set('date', '01/01/2022'),
                    ctx.json({
                        Authentication: {
                            ImapHost: 'imap.host.test.fr',
                            ImapPort: 993,
                        },
                    })
                );
            })
        );

        await waitFor(() => expect(apiCallSpy).toHaveBeenCalledTimes(1));

        expect(serverLabel.getAttribute('value')).toContain('imap.host.test.fr');
    });

    it.skip('It should display a filled form', async () => {
        const prefilledValues = {
            Email: 'guillame@yahoo.fr',
            Account: 'guillame@yahoo.fr',
            Product: ImportType.MAIL,
            ImapHost: 'imap.server.yahoo.com',
            ImapPort: '993',
        } as unknown as NormalizedImporter;
        const apiCallSpy = jest.fn();

        server.use(
            rest.get('/importer/v1/mail/importers/authinfo', (req, res, ctx) => {
                apiCallSpy();
                return res(
                    ctx.set('date', '01/01/2022'),
                    ctx.json({
                        Authentication: {
                            ImapHost: 'imap.host.test.fr',
                            ImapPort: 993,
                        },
                    })
                );
            })
        );

        easySwitchRender(<ImportMailModal addresses={ADDRESSES} currentImport={prefilledValues} />);

        const emailLabel = screen.getByLabelText('Email');
        const serverLabel = screen.getByLabelText('Mail Server (IMAP)');

        expect(emailLabel.getAttribute('value')).toContain(prefilledValues.Email);
        expect(serverLabel.getAttribute('value')).toContain(prefilledValues.ImapHost);

        // Here we should have 0 calls
        await waitFor(() => expect(apiCallSpy).toHaveBeenCalledTimes(0));

        // And Server response should not interfere with serverLabel value
        expect(serverLabel.getAttribute('value')).toContain(prefilledValues.ImapHost);
    });
});
