import { render, screen } from '@testing-library/react';

import { useCanUpdateBilling } from '@proton/account/userPermissions/hooks';
import { APPS } from '@proton/shared/lib/constants';

import SentinelUpgradeButton from './SentinelUpgradeButton';

vi.mock('@proton/account/userPermissions/hooks', () => ({ useCanUpdateBilling: vi.fn() }));
vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: APPS.PROTONACCOUNT }) }));
vi.mock('@proton/components/containers/payments/subscription/subscriptionModalContext', () => ({
    useSubscriptionModal: () => [vi.fn(), false],
}));

describe('SentinelUpgradeButton', () => {
    it('offers the upgrade to users who can update billing', () => {
        vi.mocked(useCanUpdateBilling).mockReturnValue([true, false]);
        render(<SentinelUpgradeButton app={APPS.PROTONACCOUNT} variant="user" />);

        expect(screen.getByRole('button', { name: 'Upgrade to enable Proton Sentinel' })).toBeInTheDocument();
    });

    it('asks users who cannot update billing to contact their admin', () => {
        vi.mocked(useCanUpdateBilling).mockReturnValue([false, false]);
        render(<SentinelUpgradeButton app={APPS.PROTONACCOUNT} variant="user" />);

        expect(screen.getByText(/Contact your admin to gain access/)).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
