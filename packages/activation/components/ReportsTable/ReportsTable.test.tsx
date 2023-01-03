import { fireEvent, screen, waitFor } from '@testing-library/dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { easySwitchRender } from '@proton/activation/tests/render';

import ReportsTable from './ReportsTable';

const server = setupServer();

beforeAll(() => {
    server.listen();
});
afterEach(() => server.resetHandlers());
afterAll(() => {
    server.close();
});

describe('Reports table testing', () => {
    it('Should display placeholder text when no imports available', async () => {
        const reportsSpy = jest.fn();
        const importerSpy = jest.fn();

        easySwitchRender(<ReportsTable />);

        server.use(
            rest.get('importer/v1/reports', (req, res, ctx) => {
                reportsSpy();
                return res(ctx.set('date', '01/01/2022'), ctx.json([]));
            })
        );
        server.use(
            rest.get('importer/v1/importers', (req, res, ctx) => {
                importerSpy();
                return res(ctx.set('date', '01/01/2022'), ctx.json([]));
            })
        );

        await waitFor(() => expect(reportsSpy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(importerSpy).toHaveBeenCalledTimes(1));
        screen.getByTestId('reportsTable:noImports');
    });

    it('Should display the list of finished importer', async () => {
        const finishedReport = {
            Code: 1000,
            Reports: [
                {
                    ID: 'testingImporter',
                    CreateTime: 1671548668,
                    EndTime: 1671548773,
                    Provider: 1,
                    Account: 'easyflavien@gmail.com',
                    State: 1,
                    Summary: {
                        Calendar: {
                            State: 2,
                            NumEvents: 0,
                            TotalSize: 0,
                            RollbackState: 0,
                        },
                        Contacts: {
                            State: 2,
                            NumContacts: 100,
                            NumGroups: 1,
                            TotalSize: 55003,
                            RollbackState: 0,
                        },
                        Mail: {
                            State: 2,
                            NumMessages: 88,
                            TotalSize: 1393911,
                            RollbackState: 1,
                            CanDeleteSource: 0,
                        },
                    },
                    TotalSize: 1448914,
                },
            ],
        };

        const importersSpy = jest.fn();

        easySwitchRender(<ReportsTable />);

        server.use(
            rest.get('importer/v1/reports', (req, res, ctx) => {
                importersSpy();
                return res(ctx.set('date', '01/01/2022'), ctx.json(finishedReport));
            })
        );

        await waitFor(() => expect(importersSpy).toHaveBeenCalledTimes(1));
        const reportRows = screen.getAllByTestId('reportsTable:reportRow');
        expect(reportRows).toHaveLength(3);

        const deleteReport = screen.getAllByTestId('ReportsTable:deleteReport');
        fireEvent.click(deleteReport[0]);

        await waitFor(() => screen.getByTestId('ReportsTable:deleteModal'));
    });

    it('Should allow reconnection when importer has failed', async () => {
        const importerData = {
            ID: 'testingImporter',
            Account: 'testing@proton.ch',
            Product: ['Mail'],
            Provider: 0,
            TokenID: null,
            ImapHost: 'imap.proton.ch',
            ImapPort: 993,
            Email: 'testing@testing.com',
            Sasl: 'PLAIN',
            AllowSelfSigned: 0,
            MailboxSize: {
                Archive: 0,
                Draft: 2191,
                Inbox: 315729,
                Sent: 5862,
                "Spéciæl charaters-&'(yeah": 0,
                "Spéciæl charaters-&'(yeah/sub spécïªl charaters": 7549,
                'Test folder': 134826,
                'Test folder/a test folder with big name': 10100,
                'Test folder/a test folder with big name/a sub sub folder': 13120,
                'another test foldr with a really long name hey hye hey': 226333,
            },
            Active: {
                Mail: {
                    CreateTime: 1671630060,
                    State: 4,
                    ErrorCode: 1,
                },
            },
        };

        const apiCallSpy = jest.fn();
        const importersSpy = jest.fn();
        const singleImporterSpy = jest.fn();

        easySwitchRender(<ReportsTable />);

        server.use(
            rest.get('/core/v4/features', (req, res, ctx) => {
                apiCallSpy();
                return res(ctx.set('date', '01/01/2022'), ctx.json({}));
            }),
            rest.get('/importer/v1/mail/importers/authinfo', (req, res, ctx) => {
                apiCallSpy();
                return res(ctx.set('date', '01/01/2022'), ctx.json({}));
            }),
            rest.get('/core/v4/system/config', (req, res, ctx) => {
                apiCallSpy();
                return res(ctx.set('date', '01/01/2022'), ctx.json({}));
            })
        );

        server.use(
            rest.get('importer/v1/importers', (req, res, ctx) => {
                importersSpy();
                return res(
                    ctx.set('date', '01/01/2022'),
                    ctx.json({
                        Code: 1000,
                        Importers: [importerData],
                    })
                );
            })
        );

        server.use(
            rest.get(`importer/v1/importers/${importerData.ID}`, (req, res, ctx) => {
                singleImporterSpy();
                return res(
                    ctx.set('date', '01/01/2022'),
                    ctx.json({
                        Code: 1000,
                        Importer: importerData,
                    })
                );
            })
        );

        await waitFor(() => expect(importersSpy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(apiCallSpy).toHaveBeenCalled());

        const reconnectButton = screen.getByTestId('ReportsTable:reconnectImporter');
        fireEvent.click(reconnectButton);

        await waitFor(() => expect(singleImporterSpy).toHaveBeenCalledTimes(1));

        const emailInput = screen.getByTestId('StepForm:emailInput');
        const passwordInput = screen.getByTestId('StepForm:passwordInput');
        const serverInput = screen.getByTestId('StepForm:serverInput');
        const portInput = screen.getByTestId('StepForm:portInput');
        const submitButton = screen.getByTestId('StepForm:submitButton');

        expect(emailInput).toHaveValue(importerData.Account);
        expect(serverInput).toHaveValue(importerData.ImapHost);
        expect(portInput).toHaveValue('993');
        expect(emailInput).toBeDisabled();
        expect(submitButton).toBeDisabled();

        fireEvent.change(passwordInput, { target: { value: 'app password' } });
        await waitFor(() => expect(submitButton).toBeEnabled());
    });
});
