import { render, screen } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { organizationMember } from '@proton/payments/testing/usersWhoCannotReadSubscriptions';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { OtherMailPreferencesSection } from './OtherMailPreferencesSection';

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementChecksForOrgAndUser: jest.fn(),
}));

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn(),
}));

jest.mock('./AutomaticallySaveContacts', () => () => null);
jest.mock('./KeyboardShortcut', () => ({ KeyboardShortcut: () => null }));
jest.mock('./SenderImages', () => ({ SenderImages: () => null }));
jest.mock('./UnreadFaviconCounter', () => ({ UnreadFaviconCounter: () => null }));
jest.mock('./TipsAndInsights', () => ({ TipsAndInsights: () => <div>Tips and insights</div> }));

const renderSection = ({
    subscriptionPlans,
    isPaid = true,
    loadingEntitlements = false,
    viewer = {},
}: {
    subscriptionPlans: CataloguedPlan[];
    isPaid?: boolean;
    loadingEntitlements?: boolean;
    viewer?: Partial<typeof organizationMember>;
}) => {
    jest.mocked(useUser).mockReturnValue([{ isPaid } as UserModel, false]);
    jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
        buildOrgAndUserEntitlementChecks({ subscriptionPlans, ...viewer }),
        loadingEntitlements,
    ]);
    render(<OtherMailPreferencesSection />);
};

describe('OtherMailPreferencesSection', () => {
    it.each([PLANS.MAIL, PLANS.FAMILY, PLANS.VISIONARY] as const)('shows the tips toggle for %s', (plan) => {
        renderSection({ subscriptionPlans: [plan] });

        expect(screen.getByText('Tips and insights')).toBeInTheDocument();
    });

    it.each([PLANS.MAIL_PRO, PLANS.BUNDLE_PRO_2024, PLANS.PASS_BUSINESS] as const)(
        'hides the tips toggle for business plan %s',
        (plan) => {
            renderSection({ subscriptionPlans: [plan] });

            expect(screen.queryByText('Tips and insights')).not.toBeInTheDocument();
        }
    );

    it('hides the tips toggle when Mail Plus sits next to a business subscription', () => {
        renderSection({ subscriptionPlans: [PLANS.MAIL, PLANS.VPN_BUSINESS] });

        expect(screen.queryByText('Tips and insights')).not.toBeInTheDocument();
    });

    it('hides the tips toggle for a member of a business organization', () => {
        renderSection({ subscriptionPlans: [PLANS.BUNDLE_PRO_2024], viewer: organizationMember });

        expect(screen.queryByText('Tips and insights')).not.toBeInTheDocument();
    });

    it('hides the tips toggle for free users', () => {
        renderSection({ subscriptionPlans: [], isPaid: false });

        expect(screen.queryByText('Tips and insights')).not.toBeInTheDocument();
    });

    it('hides the tips toggle while entitlements load', () => {
        renderSection({ subscriptionPlans: [PLANS.MAIL], loadingEntitlements: true });

        expect(screen.queryByText('Tips and insights')).not.toBeInTheDocument();
    });
});
