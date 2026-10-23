import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

vi.mock('@proton/components/components/orgPermissions/withPermissionGuard', () => ({
    default: (_permission: string) => (Component: any) => Component,
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
            canAdd
            provisioningDuration="7 days"
            deletingLogicals={[]}
            deletedLogicals={{}}
            renameGateway={() => () => {}}
            editGatewayServers={() => () => {}}
            editGatewayUsers={() => () => {}}
            deleteGateway={() => () => {}}
            addGateway={() => {}}
            {...props}
        />
    );

describe('GatewaysTableView', () => {
    it('renders one row per gateway, in the order given', () => {
        renderView();

        expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['DEV-VPN', 'INFRA-VPN']);
    });

    describe('when the viewer is an admin', () => {
        it('renders the members and manage columns', () => {
            renderView();

            const headers = within(screen.getAllByRole('row')[0]).getAllByRole('columnheader');

            expect(headers).toHaveLength(5);
            expect(headers[3]).toHaveTextContent('Members');
        });

        it('renders a create button that calls addGateway when clicked', async () => {
            const addGateway = vi.fn();
            renderView({ addGateway });

            await userEvent.click(screen.getByRole('button', { name: 'Create Gateway' }));

            expect(addGateway).toHaveBeenCalledOnce();
        });

        it('disables the create button when canAdd is false', () => {
            renderView({ canAdd: false });

            expect(screen.getByRole('button', { name: 'Create Gateway' })).toBeDisabled();
        });
    });

    describe('when the viewer is not an admin', () => {
        it('renders neither the members nor the manage column', () => {
            renderView({ canViewGateways: false });

            const headers = within(screen.getAllByRole('row')[0]).getAllByRole('columnheader');

            expect(headers).toHaveLength(3);
            expect(screen.queryByRole('columnheader', { name: 'Members' })).not.toBeInTheDocument();
        });

        it('renders no create button', () => {
            renderView({ canViewGateways: false });

            expect(screen.queryByRole('button', { name: 'Create Gateway' })).not.toBeInTheDocument();
        });
    });
});
