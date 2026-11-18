import { render, screen, within } from '@testing-library/react';

import type { CountryOptions } from '@proton/payments/core/countries';

import type { Gateway } from '../../../types/Gateway';
import { GatewaysTableView } from './GatewaysTableView';

vi.mock('./GatewayRow', () => ({
    GatewayRow: ({ gateway }: any) => (
        <tr>
            <td>{gateway.Name}</td>
        </tr>
    ),
}));

const gateway = (Name: string) => ({ Name, Logicals: [], Users: [], GroupIds: null }) as unknown as Gateway;

const renderView = (props: Partial<Parameters<typeof GatewaysTableView>[0]> = {}) =>
    render(
        <GatewaysTableView
            gateways={[gateway('DEV-VPN'), gateway('INFRA-VPN')]}
            countryOptions={{} as CountryOptions}
            users={[]}
            groups={[]}
            canViewGateways
            provisioningDuration="7 days"
            deletingLogicals={[]}
            deletedLogicals={{}}
            renameGateway={() => () => {}}
            editGatewayServers={() => () => {}}
            editGatewayUsers={() => () => {}}
            deleteGateway={() => () => {}}
            {...props}
        />
    );

describe('GatewaysTableView', () => {
    it('renders one row per gateway, in the order given', () => {
        renderView();

        expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['DEV-VPN', 'INFRA-VPN']);
    });

    it('renders no create button — the section owns it', () => {
        renderView();

        expect(screen.queryByRole('button', { name: 'Create Gateway' })).not.toBeInTheDocument();
    });

    describe('when the viewer is an admin', () => {
        it('renders the members and manage columns', () => {
            renderView();

            const headers = within(screen.getAllByRole('row')[0]).getAllByRole('columnheader');

            expect(headers).toHaveLength(5);
            expect(headers[3]).toHaveTextContent('Members');
        });
    });

    describe('when the viewer is not an admin', () => {
        it('renders neither the members nor the manage column', () => {
            renderView({ canViewGateways: false });

            const headers = within(screen.getAllByRole('row')[0]).getAllByRole('columnheader');

            expect(headers).toHaveLength(3);
            expect(screen.queryByRole('columnheader', { name: 'Members' })).not.toBeInTheDocument();
        });
    });
});
