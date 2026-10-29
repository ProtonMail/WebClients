import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { organizationMember } from '@proton/payments/testing/usersWhoCannotReadSubscriptions';
import type { SharedStore } from '@proton/redux-shared-store/sharedStore';

import { shouldDisplayOtherFeaturesTourStep } from './OtherFeaturesTourStep';

jest.mock('@proton/account/entitlementCatalog/actions', () => ({
    entitlementChecksForOrgAndUserThunk: jest.fn(() => 'entitlements'),
}));

const buildDispatch = (entitlements: ReturnType<typeof buildOrgAndUserEntitlementChecks>) => {
    const values: Record<string, unknown> = { entitlements };
    return jest.fn((action: string) => Promise.resolve(values[action])) as unknown as SharedStore['dispatch'];
};

const shouldDisplayFor = (subscriptionPlans: CataloguedPlan[]) =>
    shouldDisplayOtherFeaturesTourStep(buildDispatch(buildOrgAndUserEntitlementChecks({ subscriptionPlans })));

describe('shouldDisplayOtherFeaturesTourStep', () => {
    it.each([PLANS.MAIL, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY] as const)(
        'displays for %s',
        async (plan) => {
            expect(await shouldDisplayFor([plan])).toEqual({ canDisplay: true });
        }
    );

    it.each([PLANS.MAIL_PRO, PLANS.BUNDLE_PRO_2024, PLANS.BUNDLE_BIZ_2025, PLANS.PASS, PLANS.VPN2024] as const)(
        'does not display for %s',
        async (plan) => {
            expect(await shouldDisplayFor([plan])).toEqual({ canDisplay: false });
        }
    );

    it('does not display without a subscription', async () => {
        expect(await shouldDisplayFor([])).toEqual({ canDisplay: false });
    });

    it('displays when one of several subscriptions is a consumer Mail plan', async () => {
        expect(await shouldDisplayFor([PLANS.PASS, PLANS.MAIL])).toEqual({ canDisplay: true });
    });

    it('displays for a member of a family organization', async () => {
        const entitlements = buildOrgAndUserEntitlementChecks({
            subscriptionPlans: [PLANS.FAMILY],
            ...organizationMember,
        });

        expect(await shouldDisplayOtherFeaturesTourStep(buildDispatch(entitlements))).toEqual({ canDisplay: true });
    });
});
