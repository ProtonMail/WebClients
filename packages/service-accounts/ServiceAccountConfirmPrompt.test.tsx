import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { ServiceAccount } from '@proton/shared/lib/interfaces/ServiceAccount';

import ServiceAccountConfirmPrompt from './ServiceAccountConfirmPrompt';

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

const account = { MemberID: 'service-member', Name: 'ci-bot' } as ServiceAccount;

beforeEach(() => vi.clearAllMocks());

it('confirms the action, notifies and closes', async () => {
    const onConfirm = vi.fn(async () => undefined);
    const onClose = vi.fn();
    render(
        <ServiceAccountConfirmPrompt
            open
            onExit={vi.fn()}
            account={account}
            action="disable"
            onConfirm={onConfirm}
            onClose={onClose}
        />
    );
    expect(screen.getByText(/Disabling ci-bot will stop it/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Disable' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(mockCreateNotification).toHaveBeenCalledWith({ text: 'Service account disabled' });
});

it('shows the message of a non-API error', async () => {
    const onConfirm = vi.fn(async () => {
        throw new Error('You do not have permission to update service accounts.');
    });
    render(
        <ServiceAccountConfirmPrompt
            open
            onExit={vi.fn()}
            account={account}
            action="enable"
            onConfirm={onConfirm}
            onClose={vi.fn()}
        />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enable' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
        'You do not have permission to update service accounts.'
    );
});

it('stays open with the API error when the action fails', async () => {
    const onConfirm = vi.fn(async () => {
        throw { status: 422, data: { Code: 2001, Error: 'Service account does not exist' } };
    });
    const onClose = vi.fn();
    render(
        <ServiceAccountConfirmPrompt
            open
            onExit={vi.fn()}
            account={account}
            action="delete"
            onConfirm={onConfirm}
            onClose={onClose}
        />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Service account does not exist');
    expect(onClose).not.toHaveBeenCalled();
    expect(mockCreateNotification).not.toHaveBeenCalled();
});
