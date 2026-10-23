import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Gateway, GatewayLogical } from '../../../types/Gateway';
import { GatewayManageButton } from './GatewayManageButton';

const permissions = new Set<string>();

vi.mock('@proton/components/components/orgPermissions/withPermissionGuard', () => ({
    default: (permission: string) => (Component: any) => {
        const Guarded = (props: any) => (permissions.has(permission) ? <Component {...props} /> : null);
        Guarded.displayName = `Guarded(${permission})`;

        return Guarded;
    },
}));

const logical = { ID: 'l1', Name: 'DEV-VPN#3' } as GatewayLogical;
const gateway = { Name: 'DEV-VPN' } as Gateway;

const renderMenu = (props: Partial<Parameters<typeof GatewayManageButton>[0]> = {}) =>
    render(
        <GatewayManageButton
            gateway={gateway}
            logical={logical}
            deleted={false}
            deletingLogicals={[]}
            deletedLogicals={{}}
            renameGateway={() => () => {}}
            editGatewayServers={() => () => {}}
            editGatewayUsers={() => () => {}}
            deleteGateway={() => {}}
            {...props}
        />
    );

const openMenu = async () => userEvent.click(screen.getByRole('button', { name: 'Open actions dropdown' }));

beforeEach(() => {
    permissions.clear();
    permissions.add('account.gateway.update');
    permissions.add('account.gateway.delete');
});

describe('GatewayManageButton', () => {
    describe('with both update and delete permission', () => {
        it('renders rename, edit servers, edit users and delete', async () => {
            renderMenu();
            await openMenu();

            for (const action of ['Edit name', 'Edit servers', 'Edit users', 'Delete']) {
                expect(screen.getByRole('button', { name: action })).toBeInTheDocument();
            }
        });

        it('calls renameGateway with the gateway name, without the per-location suffix', async () => {
            const renameGateway = vi.fn(() => () => {});
            renderMenu({ renameGateway });
            await openMenu();

            expect(renameGateway).toHaveBeenCalledWith('l1', 'DEV-VPN');
        });
    });

    describe('without account.gateway.update', () => {
        it('renders no edit actions, but still renders delete', async () => {
            permissions.delete('account.gateway.update');
            renderMenu();
            await openMenu();

            expect(screen.queryByRole('button', { name: 'Edit name' })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Edit servers' })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Edit users' })).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
        });
    });

    describe('without account.gateway.delete', () => {
        it('renders no delete action, but still renders the edit actions', async () => {
            permissions.delete('account.gateway.delete');
            renderMenu();
            await openMenu();

            expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Edit name' })).toBeInTheDocument();
        });
    });

    describe('when the gateway is already deleted', () => {
        it('renders no delete action', async () => {
            renderMenu({ deleted: true });
            await openMenu();

            expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
        });

        it('still renders the edit actions', async () => {
            renderMenu({ deleted: true });
            await openMenu();

            expect(screen.getByRole('button', { name: 'Edit servers' })).toBeInTheDocument();
        });
    });

    describe('when a deletion has been accepted', () => {
        it('disables the edit actions for that logical', async () => {
            renderMenu({ deletedLogicals: { l1: true } });
            await openMenu();

            expect(screen.getByRole('button', { name: 'Edit name' })).toBeDisabled();
        });

        it('leaves the edit actions of another logical enabled', async () => {
            renderMenu({ deletedLogicals: { somethingElse: true } });
            await openMenu();

            expect(screen.getByRole('button', { name: 'Edit name' })).toBeEnabled();
        });
    });
});
