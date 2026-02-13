import { fireEvent, screen, waitFor } from '@testing-library/dom';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import { headers } from '@proton/activation/msw.header';
import { easySwitchRender } from '@proton/activation/src/tests/render';

import ReportsTable from './ReportsTable';

const server = setupServer();

jest.mock('@proton/mail/store/importerConfig/hooks', () => ({
    useApiEnvironmentConfig: () => [
        {
            'oauth.google.client_id': 'string',
            'oauth.outlook.client_id': 'string',
            'oauth.zoom.client_id': 'string',
        },
        false,
    ],
}));

beforeAll(() => {
    server.listen();
});
afterEach(() => server.resetHandlers());
afterAll(() => {
    server.close();
});

describe('Reports table testing', () => {
    it('Should display placeholder text when no imports available', async () => {
        server.use(
            http.get('importer/v1/reports', () => HttpResponse.json([], { headers })),
            http.get('importer/v1/importers', () => HttpResponse.json([], { headers })),
            http.get('importer/v1/sync', () => HttpResponse.json([], { headers }))
        );

        easySwitchRender(<ReportsTable />);

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

        server.use(http.get('importer/v1/reports', () => HttpResponse.json(finishedReport, { headers })));

        easySwitchRender(<ReportsTable />);

        const reportRows = await waitFor(() => screen.findAllByTestId('reportsTable:reportRow'));
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

        const importersSpy = jest.fn();
        const singleImporterSpy = jest.fn();

        server.use(
            http.get('/importer/v1/mail/importers/authinfo', () => {
                return HttpResponse.json({}, { headers });
            }),
            http.get('importer/v1/importers', () => {
                importersSpy();
                return HttpResponse.json(
                    {
                        Code: 1000,
                        Importers: [importerData],
                    },
                    { headers }
                );
            }),
            http.get(`importer/v1/importers/${importerData.ID}`, () => {
                singleImporterSpy();
                return HttpResponse.json(
                    {
                        Code: 1000,
                        Importer: importerData,
                    },
                    { headers }
                );
            })
        );

        easySwitchRender(<ReportsTable />);

        await waitFor(() => screen.getByTestId('ReportsTable:reconnectImporter'));

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

    it('Should display the list of ongoing forwarding', async () => {
        const ongoingForward = {
            Code: 1000,
            Syncs: [
                {
                    ID: 'forward-1',
                    ImporterID: 'forwardImporter-1',
                    Account: 'easyflavien@gmail.com',
                    Product: 'Mail',
                    State: 1,
                    CreateTime: 1677771164,
                    LastRenewTime: 1677771164,
                    LastImportTime: 0,
                },
            ],
        };

        const importersSpy = jest.fn();

        server.use(
            http.get('importer/v1/sync', () => {
                importersSpy();
                return HttpResponse.json(ongoingForward, { headers });
            })
        );

        easySwitchRender(<ReportsTable />);

        await waitFor(() => expect(importersSpy).toHaveBeenCalledTimes(1));
        const reportRows = screen.getAllByTestId('reportsTable:syncRow');
        expect(reportRows).toHaveLength(1);

        const deleteReport = screen.getAllByTestId('ReportsTable:deleteForward');
        fireEvent.click(deleteReport[0]);

        await waitFor(() => screen.getByTestId('ReportsTable:deleteModal'));
    });
});
