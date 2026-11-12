import { render, screen } from '@testing-library/react';

import { deleteGuestGenerationRecovery } from '../indexedDb/generationRecoveryDb';
import AppGuard from './AppGuard';

jest.mock('../indexedDb/generationRecoveryDb', () => ({ deleteGuestGenerationRecovery: jest.fn() }));
jest.mock('./auth/AuthApp', () => ({ __esModule: true, default: () => <div>Account app</div> }));
jest.mock('./guest/GuestApp', () => ({ __esModule: true, default: () => <div>Guest app</div> }));

afterEach(() => {
    window.history.replaceState({}, '', '/');
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

it.each([
    ['/guest', 'Guest app'],
    ['/u/0', 'Account app'],
])('purges legacy guest recovery on startup at %s without consulting feature flags', async (path, app) => {
    window.history.replaceState({}, '', path);
    jest.mocked(deleteGuestGenerationRecovery).mockResolvedValue(undefined);
    render(<AppGuard />);
    expect(await screen.findByText(app)).toBeVisible();
    expect(deleteGuestGenerationRecovery).toHaveBeenCalledTimes(1);
});

it('continues loading when another tab blocks legacy guest cleanup', async () => {
    window.history.replaceState({}, '', '/guest');
    jest.mocked(deleteGuestGenerationRecovery).mockRejectedValue(new Error('Cleanup blocked'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<AppGuard />);
    expect(await screen.findByText('Guest app')).toBeVisible();
    expect(warn).toHaveBeenCalledWith('[Generation recovery] Guest checkpoint cleanup is blocked or unavailable');
});
