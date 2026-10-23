import { render, screen } from '@testing-library/react';

import type { CountryOptions } from '@proton/payments/core/countries';

import type { Gateway, GatewayLogical, GatewayServer } from '../../../types/Gateway';
import { GatewayRow } from './GatewayRow';

vi.mock('@proton/app-context/useNotifications', () => ({ useNotifications: () => ({ createNotification: vi.fn() }) }));
vi.mock('@proton/components/components/button/Copy', () => ({ default: () => <button type="button">Copy</button> }));
vi.mock('@proton/payments/core/countries', () => ({ getLocalizedCountryByAbbr: (code: string) => code }));
vi.mock('../../../functions/gatewayHelpers', () => ({
    getFormattedLoad: () => '42%',
    getMembers: () => 'members cell',
}));
vi.mock('@proton/components/components/orgPermissions/withPermissionGuard', () => ({
    default: () => (Component: any) => Component,
}));

const server = (ExitIPv4: string): GatewayServer =>
    ({ ID: `s-${ExitIPv4}`, ExitIPv4, ExitIPv6: null }) as GatewayServer;

const logical = (partialLogical: Partial<GatewayLogical> = {}): GatewayLogical =>
    ({
        ID: 'l1',
        Name: 'DEV',
        ExitCountry: 'CH',
        Visible: true,
        Servers: [server('1.1.1.1')],
        ...partialLogical,
    }) as GatewayLogical;

const gateway = (Logicals: GatewayLogical[]): Gateway => ({ Name: 'DEV-VPN', Logicals }) as Gateway;

const renderRow = (props: Partial<Parameters<typeof GatewayRow>[0]> = {}) =>
    render(
        <table>
            <tbody>
                <GatewayRow
                    isAdmin
                    gateway={gateway([logical()])}
                    users={[]}
                    groups={[]}
                    countryOptions={{} as CountryOptions}
                    provisioningDuration="7 days"
                    deletingLogicals={[]}
                    deletedLogicals={{}}
                    renameGateway={() => () => {}}
                    editGatewayServers={() => () => {}}
                    editGatewayUsers={() => () => {}}
                    deleteGateway={() => {}}
                    {...props}
                />
            </tbody>
        </table>
    );

describe('GatewayRow', () => {
    describe('when the viewer is an admin', () => {
        it('renders the members cell and the actions menu', () => {
            renderRow();

            expect(screen.getByRole('cell', { name: 'members cell' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Open actions dropdown' })).toBeInTheDocument();
        });
    });

    describe('when the viewer is not an admin', () => {
        it('renders neither the members cell nor the actions menu', () => {
            renderRow({ isAdmin: false });

            expect(screen.queryByRole('cell', { name: 'members cell' })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Open actions dropdown' })).not.toBeInTheDocument();
        });
    });

    describe('status', () => {
        it('renders active when a logical has servers', () => {
            renderRow();

            expect(screen.getByRole('cell', { name: 'active' })).toBeInTheDocument();
        });

        it('renders inactive when no logical has servers yet', () => {
            renderRow({ gateway: gateway([logical({ Servers: [] })]) });

            expect(screen.getByRole('cell', { name: 'inactive' })).toBeInTheDocument();
        });
    });

    describe('provisioning', () => {
        it('renders a provisioning message instead of an address when a logical has no servers', () => {
            renderRow({ gateway: gateway([logical({ Servers: [] })]) });

            expect(screen.getByText(/still being set up/)).toBeInTheDocument();
        });

        it('counts only the logicals without servers as pending', () => {
            renderRow({
                gateway: gateway([logical({ ID: 'a' }), logical({ ID: 'b', Servers: [] })]),
            });

            expect(screen.getByRole('cell', { name: 'active' })).toBeInTheDocument();
            expect(screen.getByText(/still being set up/)).toBeInTheDocument();
        });
    });

    describe('when every logical is deleted', () => {
        const deletedGateway = gateway([logical({ Visible: false })]);

        it('renders nothing when showDeleted is false', () => {
            renderRow({ gateway: deletedGateway });

            expect(screen.queryByRole('row')).not.toBeInTheDocument();
        });

        it('marks the row as deleted when showDeleted is true', () => {
            renderRow({ gateway: deletedGateway, showDeleted: true });

            expect(screen.getByRole('row')).toHaveAttribute('data-deleted', 'true');
        });

        it('does not mark the row as deleted when only some logicals are deleted', () => {
            renderRow({ gateway: gateway([logical({ ID: 'a' }), logical({ ID: 'b', Visible: false })]) });

            expect(screen.getByRole('row')).toHaveAttribute('data-deleted', 'false');
        });
    });

    describe('display settings', () => {
        it('renders the exit address when showIPv4 is true', () => {
            renderRow({ showIPv4: true });

            expect(screen.getByText(/1\.1\.1\.1/)).toBeInTheDocument();
        });

        it('renders no exit address when showIPv4 is false', () => {
            renderRow({ showIPv4: false });

            expect(screen.queryByText(/1\.1\.1\.1/)).not.toBeInTheDocument();
        });

        it('renders the load when showLoad is true', () => {
            renderRow({ showLoad: true });

            expect(screen.getByText(/42%/)).toBeInTheDocument();
        });
    });
});
