import { PLANS } from '@proton/payments/core/constants';
import { type CataloguedPlan, buildOrgAndUserEntitlementChecks } from '@proton/payments/testing/prodCatalogGrants';
import { organizationMember } from '@proton/payments/testing/usersWhoCannotReadSubscriptions';
import type { SharedStore } from '@proton/redux-shared-store/sharedStore';
import logoVpn from '@proton/styles/assets/img/onboarding/feature_tour-logo-vpn.svg';
import vpnAppBackground from '@proton/styles/assets/img/onboarding/feature_tour-vpn-background.svg';

import { shouldDisplayProtonVPNTourStep } from './ProtonVPNTourStep';

jest.mock('@proton/account/entitlementCatalog/actions', () => ({
    entitlementChecksForOrgAndUserThunk: jest.fn(() => 'entitlements'),
}));

const preloadUrls = [logoVpn, vpnAppBackground];

const buildDispatch = (entitlements: ReturnType<typeof buildOrgAndUserEntitlementChecks>) => {
    const values: Record<string, unknown> = { entitlements };
    return jest.fn((action: string) => Promise.resolve(values[action])) as unknown as SharedStore['dispatch'];
};

const shouldDisplayFor = (subscriptionPlans: CataloguedPlan[]) =>
    shouldDisplayProtonVPNTourStep(buildDispatch(buildOrgAndUserEntitlementChecks({ subscriptionPlans })));

describe('shouldDisplayProtonVPNTourStep', () => {
    it.each([PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY] as const)('displays for %s', async (plan) => {
        expect(await shouldDisplayFor([plan])).toEqual({ canDisplay: true, preloadUrls });
    });

    it.each([
        PLANS.MAIL,
        PLANS.PASS,
        PLANS.VPN2024,
        PLANS.MAIL_PRO,
        PLANS.BUNDLE_PRO_2024,
        PLANS.BUNDLE_BIZ_2025,
    ] as const)('does not display for %s', async (plan) => {
        expect(await shouldDisplayFor([plan])).toEqual({ canDisplay: false, preloadUrls });
    });

    it('does not display without a subscription', async () => {
        expect(await shouldDisplayFor([])).toEqual({ canDisplay: false, preloadUrls });
    });

    it('does not display when Mail, Pass and VPN come from different subscriptions', async () => {
        expect(await shouldDisplayFor([PLANS.MAIL, PLANS.PASS, PLANS.VPN2024])).toEqual({
            canDisplay: false,
            preloadUrls,
        });
    });

    it('displays when one of several subscriptions is a consumer bundle', async () => {
        expect(await shouldDisplayFor([PLANS.PASS, PLANS.BUNDLE])).toEqual({ canDisplay: true, preloadUrls });
    });

    it('displays for a member of a family organization', async () => {
        const entitlements = buildOrgAndUserEntitlementChecks({
            subscriptionPlans: [PLANS.FAMILY],
            ...organizationMember,
        });

        expect(await shouldDisplayProtonVPNTourStep(buildDispatch(entitlements))).toEqual({
            canDisplay: true,
            preloadUrls,
        });
    });
});
