import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { ServiceAccount } from '@proton/shared/lib/interfaces/ServiceAccount';
import { ServiceAccountState } from '@proton/shared/lib/interfaces/ServiceAccount';

import CreateServiceAccountModal from './CreateServiceAccountModal';
import EditServiceAccountModal from './EditServiceAccountModal';
import { ServiceAccountSetupError } from './actions';
import { SERVICE_ACCOUNT_NAME_SUGGESTIONS } from './suggestedServiceAccountNames';

const mockCreateNotification = vi.fn();
// The DOM environment does not handle the `dialog` element correctly (https://github.com/jsdom/jsdom/issues/3294).
vi.mock('@proton/components/components/dialog/Dialog', async () => {
    const { forwardRef, createElement } = await import('react');
    return {
        __esModule: true,
        default: forwardRef(({ children, ...rest }: any, ref: any) => createElement('div', { ...rest, ref }, children)),
    };
});

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));
vi.mock('./ServiceAccountManagers', () => ({
    __esModule: true,
    default: ({ onChange }: { onChange: (managers: { MemberID: string; Name: string; Email: string }[]) => void }) => (
        <div>
            Managers editor
            <button
                type="button"
                onClick={() => onChange([{ MemberID: 'new-manager', Name: 'New manager', Email: 'new@example.test' }])}
            >
                Select test manager
            </button>
        </div>
    ),
}));

const account: ServiceAccount = {
    MemberID: 'service-member',
    UserID: 'service-user',
    AddressID: 'service-address',
    Name: 'ci-bot',
    Email: 'ci-bot.nu4q1@example.test',
    Managers: [],
    CreateTime: 1,
    State: ServiceAccountState.NoTokens,
};

const getProps = () => ({
    usedNames: new Set<string>(),
    members: {},
    excludedMemberIDs: [],
    canAssign: true,
    canRemove: true,
    open: true,
    onClose: vi.fn(),
    onExit: vi.fn(),
});
const getCreateProps = () => ({
    ...getProps(),
    checkEmail: vi.fn(async (_: string): Promise<{ email?: string; error?: string }> => ({})),
    onCreate: vi.fn(async (_: unknown) => undefined),
});
const getEditProps = () => ({
    ...getProps(),
    account,
    canEditName: true,
    onSave: vi.fn(async (_: unknown) => undefined),
});

const getName = () => screen.getByLabelText<HTMLInputElement>('Service name');
const typeName = (value: string) => fireEvent.change(getName(), { target: { value } });

describe('CreateServiceAccountModal', () => {
    it('prefills and selects a suggestion that is not already used by a service account', () => {
        render(
            <CreateServiceAccountModal
                {...getCreateProps()}
                usedNames={new Set(SERVICE_ACCOUNT_NAME_SUGGESTIONS.filter((name) => name !== 'data-pipeline'))}
            />
        );
        const name = getName();
        expect(name).toHaveValue('data-pipeline');
        expect(name).toHaveFocus();
        expect(name.selectionStart).toBe(0);
        expect(name.selectionEnd).toBe(name.value.length);
        expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument();
    });

    it('looks for a free address when the name field loses focus and creates with it', async () => {
        const props = getCreateProps();
        props.checkEmail.mockResolvedValue({ email: 'ci-bot2@example.test' });
        render(<CreateServiceAccountModal {...props} />);
        typeName('ci-bot');
        fireEvent.blur(getName());
        await waitFor(() => expect(props.checkEmail).toHaveBeenCalledWith('ci-bot'));

        fireEvent.click(screen.getByRole('button', { name: 'Add service account' }));
        await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
        expect(props.checkEmail.mock.calls).toEqual([['ci-bot']]);
        expect(props.onCreate).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'ci-bot', email: 'ci-bot2@example.test' })
        );
    });

    it('looks for a free address on submit when the field did not lose focus', async () => {
        const props = getCreateProps();
        props.checkEmail.mockResolvedValue({ email: 'ci-bot2@example.test' });
        render(<CreateServiceAccountModal {...props} />);
        typeName('ci-bot');
        fireEvent.submit(getName());
        await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
        expect(props.onCreate).toHaveBeenCalledWith(expect.objectContaining({ email: 'ci-bot2@example.test' }));
    });

    it('shows why the name cannot get an address, and does not create the account', async () => {
        const props = getCreateProps();
        props.checkEmail.mockResolvedValue({ error: 'This name does not make a valid address. Try another name.' });
        render(<CreateServiceAccountModal {...props} />);
        typeName('ci-bot');
        fireEvent.submit(getName());
        await waitFor(() =>
            expect(getName()).toHaveAccessibleDescription('This name does not make a valid address. Try another name.')
        );
        expect(screen.getByRole('button', { name: 'Add service account' })).toBeDisabled();
        expect(props.onCreate).not.toHaveBeenCalled();
    });

    it('leaves finding the address to the creation when the check itself failed', async () => {
        const props = getCreateProps();
        render(<CreateServiceAccountModal {...props} />);
        typeName('ci-bot');
        fireEvent.submit(getName());
        await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
        expect(props.onCreate).toHaveBeenCalledWith(expect.objectContaining({ email: undefined }));
    });

    it('submits a new account with the selected manager', async () => {
        const props = getCreateProps();
        render(<CreateServiceAccountModal {...props} />);
        typeName(' CI Bot ');
        fireEvent.click(screen.getByRole('button', { name: 'Select test manager' }));
        fireEvent.click(screen.getByRole('button', { name: 'Add service account' }));
        await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
        expect(props.onCreate).toHaveBeenCalledWith({
            pending: undefined,
            email: undefined,
            name: 'CI Bot',
            managers: [{ MemberID: 'new-manager', Name: 'New manager', Email: 'new@example.test' }],
        });
        expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Service account saved' });
    });

    it('reuses the created account when its setup fails and the user retries', async () => {
        const props = getCreateProps();
        props.onCreate.mockRejectedValueOnce(new ServiceAccountSetupError(account, new Error('Key setup unavailable')));
        render(<CreateServiceAccountModal {...props} />);
        typeName(account.Name);
        fireEvent.click(screen.getByRole('button', { name: 'Add service account' }));
        await screen.findByText('Key setup unavailable');
        expect(screen.getByText(/The service account was created/)).toBeInTheDocument();
        expect(props.onClose).not.toHaveBeenCalled();
        // The created account holds the address now, so it is not checked again.
        typeName('renamed-bot');

        fireEvent.click(screen.getByRole('button', { name: 'Add service account' }));
        await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
        expect(props.onCreate).toHaveBeenLastCalledWith({
            pending: account,
            email: undefined,
            name: 'renamed-bot',
            managers: [],
        });
        expect(props.checkEmail).toHaveBeenCalledTimes(1);
    });

    it('shows a backend error without closing, and lets the admin retry', async () => {
        const props = getCreateProps();
        props.onCreate.mockRejectedValueOnce({
            status: 409,
            data: { Code: 2500, Error: 'Name already used within your organization' },
        });
        render(<CreateServiceAccountModal {...props} />);
        typeName('vault-sync');
        fireEvent.click(screen.getByRole('button', { name: 'Add service account' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Name already used within your organization');
        expect(screen.queryByText(/The service account was created/)).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Add service account' }));
        await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
        expect(props.onCreate).toHaveBeenLastCalledWith(expect.objectContaining({ pending: undefined }));
    });

    it('does not flag the name as used when the list refreshes with the account just created', async () => {
        const props = getCreateProps();
        let finish = () => {};
        props.onCreate.mockImplementation(
            () => new Promise<undefined>((resolve) => (finish = () => resolve(undefined)))
        );
        const { rerender } = render(<CreateServiceAccountModal {...props} />);
        typeName('ci-bot');
        fireEvent.click(screen.getByRole('button', { name: 'Add service account' }));
        await waitFor(() => expect(props.onCreate).toHaveBeenCalled());

        rerender(<CreateServiceAccountModal {...props} usedNames={new Set(['ci-bot'])} />);
        expect(getName()).not.toHaveAccessibleDescription('Name already used within your organization');
        finish();
        await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
        rerender(<CreateServiceAccountModal {...props} usedNames={new Set(['ci-bot'])} />);
        expect(getName()).not.toHaveAccessibleDescription('Name already used within your organization');
    });

    it('disables submission for an empty name', () => {
        const props = getCreateProps();
        render(<CreateServiceAccountModal {...props} />);
        typeName('   ');
        expect(screen.getByRole('button', { name: 'Add service account' })).toBeDisabled();
    });

    it('validates a name that is already used inline', () => {
        const props = getCreateProps();
        render(<CreateServiceAccountModal {...props} usedNames={new Set(['vault-sync'])} />);
        typeName(' Vault-Sync ');
        expect(getName()).toHaveAccessibleDescription('Name already used within your organization');
        expect(screen.getByRole('button', { name: 'Add service account' })).toBeDisabled();
        typeName('unique-bot');
        expect(getName()).not.toHaveAccessibleDescription('Name already used within your organization');
    });
});

describe('EditServiceAccountModal', () => {
    it('submits edits to an existing account and does not flag its own name', async () => {
        const props = getEditProps();
        render(<EditServiceAccountModal {...props} usedNames={new Set([account.Name])} />);
        expect(getName()).not.toHaveAccessibleDescription('Name already used within your organization');
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
        typeName('renamed-bot');
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
        expect(props.onSave).toHaveBeenCalledWith({ account, name: 'renamed-bot', managers: [] });
    });

    it('enables saving when only the managers change', async () => {
        const props = getEditProps();
        render(<EditServiceAccountModal {...props} />);
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Select test manager' }));
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
        expect(props.onSave).toHaveBeenCalledWith({
            account,
            name: account.Name,
            managers: [{ MemberID: 'new-manager', Name: 'New manager', Email: 'new@example.test' }],
        });
    });

    it('keeps the name read-only without the update permission and hides the email', () => {
        render(<EditServiceAccountModal {...getEditProps()} canEditName={false} />);
        expect(getName()).toHaveValue(account.Name);
        expect(getName()).toBeDisabled();
        expect(screen.queryByText(account.Email)).not.toBeInTheDocument();
    });
});
