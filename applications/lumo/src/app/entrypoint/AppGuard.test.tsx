import { render, screen } from '@testing-library/react';

import { deleteGuestGenerationRecovery } from '../indexedDb/generationRecoveryDb';
import AppGuard from './AppGuard';

vi.mock('../indexedDb/generationRecoveryDb', () => ({ deleteGuestGenerationRecovery: vi.fn() }));
vi.mock('./auth/AuthApp', () => ({ __esModule: true, default: () => <div>Account app</div> }));
vi.mock('./guest/GuestApp', () => ({ __esModule: true, default: () => <div>Guest app</div> }));

afterEach(() => {
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

it.each([
    ['/guest', 'Guest app'],
    ['/u/0', 'Account app'],
])('purges legacy guest recovery on startup at %s without consulting feature flags', async (path, app) => {
    window.history.replaceState({}, '', path);
    vi.mocked(deleteGuestGenerationRecovery).mockResolvedValue(undefined);
    render(<AppGuard />);
    expect(await screen.findByText(app)).toBeVisible();
    expect(deleteGuestGenerationRecovery).toHaveBeenCalledTimes(1);
});

it('continues loading when another tab blocks legacy guest cleanup', async () => {
    window.history.replaceState({}, '', '/guest');
    vi.mocked(deleteGuestGenerationRecovery).mockRejectedValue(new Error('Cleanup blocked'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<AppGuard />);
    expect(await screen.findByText('Guest app')).toBeVisible();
    expect(warn).toHaveBeenCalledWith('[Generation recovery] Guest checkpoint cleanup is blocked or unavailable');
});
