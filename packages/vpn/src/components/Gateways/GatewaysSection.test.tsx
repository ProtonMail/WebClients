import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Organization } from '@proton/shared/lib/interfaces/Organization';

import type { Gateway } from '../../types/Gateway';
import { GatewaysSection } from './GatewaysSection';

const mocks = vi.hoisted(() => ({
    showCreateModal: vi.fn(),
    useUser: vi.fn(),
    useUserPermissions: vi.fn(),
    useGateways: vi.fn(),
}));

vi.mock('@proton/account/user/hooks', () => ({ useUser: () => mocks.useUser() }));
vi.mock('@proton/account/userPermissions/hooks', () => ({ useUserPermissions: () => mocks.useUserPermissions() }));
vi.mock('@proton/account/userSettings/hooks', () => ({ useUserSettings: () => [{ Locale: 'en_US' }, false] }));
vi.mock('@proton/app-context/useApi', () => ({ useApi: () => vi.fn() }));
vi.mock('@proton/app-context/useNotifications', () => ({ useNotifications: () => ({ createNotification: vi.fn() }) }));
vi.mock('@proton/components/components/modalTwo/useModalTwo', () => ({
    useModalTwoStatic: () => [null, mocks.showCreateModal],
}));
vi.mock('@proton/components/containers/payments/subscription/subscriptionModalContext', () => ({
    useSubscriptionModalRaw: () => vi.fn(),
}));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => false }));
vi.mock('../../hooks/useGateways', () => ({ useGateways: () => mocks.useGateways() }));

// The modals are only handed to the (mocked) modal hook, and the view has its own tests. The section
// is on trial here for the chrome it owns around them.
vi.mock('./GatewayRenameModal', () => ({ GatewayRenameModal: () => null }));
vi.mock('./GatewayServersModal', () => ({ GatewayServersModal: () => null }));
vi.mock('./GatewayUsersModal', () => ({ GatewayUsersModal: () => null }));
vi.mock('./RemoveGatewayConfirmationModal', () => ({ RemoveGatewayConfirmationModal: () => null }));
vi.mock('./tableview/GatewayModal', () => ({ GatewayModal: () => null }));
vi.mock('./tableview/GatewaysTableView', () => ({
    GatewaysTableView: () => <div data-testid="gateways-table-view" />,
}));

const organization = (MaxDedicatedIPs: number) => ({ MaxDedicatedIPs }) as Organization;

const gateway = (Name: string): Gateway =>
    ({
        Name,
        ExitCountry: 'CH',
        Logicals: [{ ID: `logical-${Name}`, Visible: true, Servers: [{}] }],
    }) as unknown as Gateway;

const createButton = () => screen.getByRole('button', { name: 'Create Gateway' });

const renderSection = ({
    maxDedicatedIPs = 10,
    isAdmin = true,
    permissions = { 'account.gateway.read': true, 'account.gateway.create': true } as Record<string, boolean>,
    gateways = [gateway('DEV-VPN')] as readonly Gateway[],
} = {}) => {
    mocks.useUser.mockReturnValue([{ isAdmin, isSelf: true }, false]);
    mocks.useUserPermissions.mockReturnValue([{ permissions }, false]);
    mocks.useGateways.mockReturnValue({
        hasGatewaysAccess: true,
        planWithIpAddon: undefined,
        config: {
            Table: { IPv4: true, IPv6: false, Load: false, Deleted: false },
            ServerTable: { IPv4: true, IPv6: false, Load: true, Deleted: false },
            Provisioning: { TranslatedDuration: '7 days' },
        },
        users: [],
        groups: [],
        locations: [],
        gateways,
        refresh: vi.fn(),
    });

    return render(<GatewaysSection organization={organization(maxDedicatedIPs)} />);
};

describe('GatewaysSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when the viewer is an admin', () => {
        it('renders the create button above the view, so the view does not own it', () => {
            const { container } = renderSection();

            // querySelectorAll returns document order, so the indexes say which comes first.
            const inDocumentOrder = Array.from(container.querySelectorAll('button, [data-testid]'));

            expect(inDocumentOrder.indexOf(createButton())).toBeLessThan(
                inDocumentOrder.indexOf(screen.getByTestId('gateways-table-view'))
            );
        });

        it('opens the create modal when the create button is clicked', async () => {
            renderSection();

            await userEvent.click(createButton());

            expect(mocks.showCreateModal).toHaveBeenCalledTimes(1);
        });

        it('disables the create button when the organization has no room for another gateway', () => {
            renderSection({ maxDedicatedIPs: 1 });

            expect(createButton()).toBeDisabled();
        });

        it('disables the create button when the admin lacks the create permission', () => {
            renderSection({ permissions: { 'account.gateway.read': true } });

            expect(createButton()).toBeDisabled();
        });
    });

    describe('when the viewer cannot view gateways', () => {
        it('renders no create button', () => {
            renderSection({ isAdmin: false, permissions: {} });

            expect(screen.queryByRole('button', { name: 'Create Gateway' })).not.toBeInTheDocument();
        });
    });

    describe('when there is no gateway yet', () => {
        it('renders a single create button, in the empty state', () => {
            renderSection({ gateways: [] });

            expect(screen.getAllByRole('button', { name: 'Create Gateway' })).toHaveLength(1);
            expect(screen.queryByTestId('gateways-table-view')).not.toBeInTheDocument();
        });
    });
});
