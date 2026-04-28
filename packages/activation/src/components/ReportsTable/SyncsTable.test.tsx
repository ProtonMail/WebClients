import { fireEvent, screen, waitFor } from '@testing-library/dom';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import { getModelState } from '@proton/account/test';
import { headers } from '@proton/activation/msw.header';
import { easySwitchRender } from '@proton/activation/src/tests/render';
import { ADDRESS_FLAGS, ADDRESS_RECEIVE, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';

import { SyncsTable } from './SyncsTable';

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

describe('Syncs table testing', () => {
    it('Should not display the forwarding history when no forwarding available', async () => {
        server.use(http.get('importer/v1/sync', () => HttpResponse.json([], { headers })));

        easySwitchRender(<SyncsTable />);

        expect(screen.queryByText('Forwarding history')).not.toBeInTheDocument();
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

        easySwitchRender(<SyncsTable />);

        await waitFor(() => expect(importersSpy).toHaveBeenCalledTimes(1));
        const reportRows = screen.getAllByTestId('reportsTable:syncRow');
        expect(reportRows).toHaveLength(1);

        const deleteReport = screen.getAllByTestId('ReportsTable:deleteForward');
        fireEvent.click(deleteReport[0]);

        await waitFor(() => screen.getByTestId('ReportsTable:deleteModal'));
    });

    it('Should display BYOE addresses', async () => {
        const byoeAddress = {
            ID: 'address-byoe',
            Email: 'byoe@gmail.com',
            Status: ADDRESS_STATUS.STATUS_ENABLED,
            Receive: ADDRESS_RECEIVE.RECEIVE_YES,
            Flags: ADDRESS_FLAGS.BYOE,
        } as Address;

        server.use(http.get('importer/v1/sync', () => HttpResponse.json({ Code: 1000, Syncs: [] }, { headers })));

        easySwitchRender(<SyncsTable />, { addresses: getModelState([byoeAddress]) });

        const byoeRows = await screen.findAllByTestId('reportsTable:byoeAddressRow');
        expect(byoeRows).toHaveLength(1);
    });
});
