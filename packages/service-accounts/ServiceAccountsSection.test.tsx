import { MemoryRouter } from 'react-router-dom';

import { act, fireEvent, render, screen } from '@testing-library/react';

import type { ServiceAccount } from '@proton/shared/lib/interfaces/ServiceAccount';
import { ServiceAccountState } from '@proton/shared/lib/interfaces/ServiceAccount';

import ServiceAccountsSection from './ServiceAccountsSection';

const mockRefresh = vi.fn();
const mockCreate = vi.fn();
let mockError: Error | undefined;
let mockAccounts: ServiceAccount[];
let mockPermissions: Record<string, unknown>;

vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-account' }) }));
vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));
vi.mock('./useServiceAccounts', () => ({
    useServiceAccounts: () => ({
        accounts: mockAccounts,
        members: {},
        managerNames: {},
        usedNames: new Set(),
        permissions: mockPermissions,
        loading: false,
        error: mockError,
        refresh: mockRefresh,
        create: mockCreate,
    }),
}));
vi.mock('./CreateServiceAccountModal', () => ({
    __esModule: true,
    default: ({ onCreate }: { onCreate: (args: unknown) => Promise<void> }) => (
        <dialog open>
            Create account
            <button type="button" onClick={() => onCreate({ name: 'new-bot', managers: [] })}>
                Save
            </button>
        </dialog>
    ),
}));

const getAccount = (MemberID: string, Name: string) =>
    ({
        MemberID,
        Name,
        Email: `${Name}@example.test`,
        State: ServiceAccountState.NoManager,
        Managers: [],
    }) as unknown as ServiceAccount;

const getAddButton = () => screen.getByRole('button', { name: 'Add service account' });

beforeEach(() => {
    vi.clearAllMocks();
    mockError = undefined;
    mockAccounts = [getAccount('member', 'ci-bot')];
    mockPermissions = { hasCreatePermission: true, canCreate: true, limitReached: false, maxServiceAccounts: 2 };
});

it('opens the creation modal when creation is allowed', async () => {
    render(<ServiceAccountsSection />);
    fireEvent.click(getAddButton());
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
});

it.each([0, 1])('disables creation at quota %i and explains the limit on keyboard focus', async (quota) => {
    mockPermissions = { hasCreatePermission: true, canCreate: false, limitReached: true, maxServiceAccounts: quota };
    render(<ServiceAccountsSection />);
    expect(getAddButton()).toBeDisabled();
    fireEvent.focus(getAddButton().parentElement!);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
        `Your organization has reached its limit of ${quota} service account${quota === 1 ? '' : 's'}.`
    );
});

it('disables creation without a limit tooltip while the limit is unknown', () => {
    mockPermissions = { hasCreatePermission: true, canCreate: false, limitReached: false, maxServiceAccounts: 0 };
    render(<ServiceAccountsSection />);
    expect(getAddButton()).toBeDisabled();
    expect(getAddButton().parentElement).not.toHaveAttribute('tabindex');
});

it('hides the add button without the create permission', () => {
    mockPermissions = { hasCreatePermission: false, canCreate: false, limitReached: false, maxServiceAccounts: 2 };
    render(<ServiceAccountsSection />);
    expect(screen.queryByRole('button', { name: 'Add service account' })).not.toBeInTheDocument();
});

it('asks to set up a custom domain instead of showing the list when there is none', () => {
    mockPermissions = { ...mockPermissions, canCreate: false, showMissingDomainWarning: true };
    render(
        <MemoryRouter>
            <ServiceAccountsSection />
        </MemoryRouter>
    );
    expect(screen.getByText('Set up a custom domain to use service accounts')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add domain' })).toHaveAttribute(
        'href',
        expect.stringContaining('/domain-names')
    );
    expect(screen.queryByRole('button', { name: 'Add service account' })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search for a service account')).not.toBeInTheDocument();
    expect(screen.queryByTestId('service-accounts-table')).not.toBeInTheDocument();
});

it('shows an inline error with a retry when the list cannot be loaded', () => {
    mockError = new Error('offline');
    render(<ServiceAccountsSection />);
    expect(screen.getByText('Service accounts could not be loaded.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
});

it('shows a placeholder row instead of the new account until its creation finishes', async () => {
    let finish = () => {};
    mockCreate.mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));
    const { rerender } = render(<ServiceAccountsSection />);
    fireEvent.click(getAddButton());
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));

    // The list refreshes with the new account before its managers are set up.
    mockAccounts = [...mockAccounts, getAccount('new-member', 'new-bot')];
    rerender(<ServiceAccountsSection />);
    expect(screen.getByText('Adding service account')).toBeInTheDocument();
    expect(screen.queryByText('new-bot')).not.toBeInTheDocument();
    expect(screen.getByText('ci-bot')).toBeInTheDocument();

    await act(async () => finish());
    expect(screen.queryByText('Adding service account')).not.toBeInTheDocument();
    expect(screen.getByText('new-bot')).toBeInTheDocument();
});

it('disables the search field until there are service accounts', () => {
    mockAccounts = [];
    const { rerender } = render(<ServiceAccountsSection />);
    expect(screen.getByPlaceholderText('Search for a service account')).toBeDisabled();

    mockAccounts = [getAccount('member', 'ci-bot')];
    rerender(<ServiceAccountsSection />);
    expect(screen.getByPlaceholderText('Search for a service account')).toBeEnabled();
});
