import { fireEvent, render, screen } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useCanUpdateBilling } from '@proton/account/userPermissions/hooks';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';

import DWMUpgrade from './DWMUpgrade';

const mockOpenSubscriptionModal = vi.fn();

vi.mock('@proton/account/userPermissions/hooks', () => ({ useCanUpdateBilling: vi.fn() }));
vi.mock('@proton/account/entitlementCatalog/hooks', () => ({ useEntitlementChecksForOrgAndUser: vi.fn() }));
vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ APP_NAME: 'proton-account' }) }));
vi.mock('../payments/subscription/subscriptionModalContext', () => ({
    useSubscriptionModal: () => [mockOpenSubscriptionModal, false],
}));

const renderUpgrade = ({ canUpdateBilling, isB2B }: { canUpdateBilling: boolean; isB2B: boolean }) => {
    vi.mocked(useCanUpdateBilling).mockReturnValue([canUpdateBilling, false]);
    vi.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([{ isB2B } as any, false]);
    render(<DWMUpgrade />);
};

const upgradeButtonName = `Upgrade to enable ${DARK_WEB_MONITORING_NAME}`;

describe('DWMUpgrade', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('opens the business plans for admins of a business organization', () => {
        renderUpgrade({ canUpdateBilling: true, isB2B: true });

        fireEvent.click(screen.getByRole('button', { name: upgradeButtonName }));

        expect(mockOpenSubscriptionModal).toHaveBeenCalledWith(
            expect.objectContaining({ step: SUBSCRIPTION_STEPS.PLAN_SELECTION, defaultAudience: Audience.B2B })
        );
    });

    it('opens the personal plans outside a business organization', () => {
        renderUpgrade({ canUpdateBilling: true, isB2B: false });

        fireEvent.click(screen.getByRole('button', { name: upgradeButtonName }));

        expect(mockOpenSubscriptionModal).toHaveBeenCalledWith(
            expect.objectContaining({ defaultAudience: Audience.B2C })
        );
    });

    it('asks users who cannot update billing to contact their admin', () => {
        renderUpgrade({ canUpdateBilling: false, isB2B: true });

        expect(screen.getByText(/Contact your admin to gain access/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: upgradeButtonName })).not.toBeInTheDocument();
    });
});
