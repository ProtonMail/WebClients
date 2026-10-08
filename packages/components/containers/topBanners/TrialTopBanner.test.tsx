import { screen } from '@testing-library/react';
import { addDays, getUnixTime } from 'date-fns';

import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getSubscriptionState } from '@proton/payments/testing/redux-state';
import { APPS } from '@proton/shared/lib/constants';

import { renderWithProviders } from '../../testing/renderWithProviders';
import TrialTopBanner from './TrialTopBanner';

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    ...jest.requireActual('@proton/account/entitlementCatalog/hooks'),
    useEntitlementCatalog: jest.fn(),
}));

jest.mock('@proton/account/paymentMethods/hooks', () => ({
    ...jest.requireActual('@proton/account/paymentMethods/hooks'),
    usePaymentMethods: jest.fn(),
}));

describe('TrialTopBanner', () => {
    let b2bTrial: Subscription;

    const renderBanner = () =>
        renderWithProviders(<TrialTopBanner app={APPS.PROTONMAIL} />, {
            preloadedState: { subscription: getSubscriptionState(b2bTrial) },
        });

    beforeEach(() => {
        jest.clearAllMocks();
        (usePaymentMethods as jest.Mock).mockReturnValue([[], false]);
        b2bTrial = buildSubscription(PLANS.BUNDLE_PRO_2024, {
            IsTrial: true,
            PeriodEnd: getUnixTime(addDays(new Date(), 3)),
        });
    });

    it('renders the B2B trial banner once the entitlement catalog is loaded', () => {
        (useEntitlementCatalog as jest.Mock).mockReturnValue([
            buildEntitlementCatalog({ [PLANS.BUNDLE_PRO_2024]: [EntitlementName.Business] }),
            false,
        ]);

        renderBanner();

        expect(screen.getByRole('link', { name: 'Add a payment method' })).toBeInTheDocument();
    });

    it('renders no banner while the entitlement catalog is loading', () => {
        (useEntitlementCatalog as jest.Mock).mockReturnValue([undefined, true]);

        const { container } = renderBanner();

        expect(container).toBeEmptyDOMElement();
    });
});
