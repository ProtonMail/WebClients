import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';

import { getAlwaysOnVpnPageAvailability } from './getAlwaysOnVpnPageAvailability';

const getAvailability = ({
    plans,
    canReadAlwaysOn = true,
    isAlwaysOnVpnEnabled = true,
}: {
    plans: CataloguedPlan[];
    canReadAlwaysOn?: boolean;
    isAlwaysOnVpnEnabled?: boolean;
}) =>
    getAlwaysOnVpnPageAvailability({
        entitlements: buildOrgAndUserEntitlementChecks({ subscriptionPlans: plans }),
        permissions: { 'account.always_on.read': canReadAlwaysOn },
        isAlwaysOnVpnEnabled,
    }).alwaysOnVpn;

describe('getAlwaysOnVpnPageAvailability', () => {
    it.each([PLANS.VPN_BUSINESS, PLANS.VPN_PRO, PLANS.BUNDLE_PRO_2024] as const)(
        'shows the page to a %s organization',
        (plan) => {
            expect(getAvailability({ plans: [plan] })).toBe(true);
        }
    );

    it.each([PLANS.PASS_BUSINESS, PLANS.PASS_PRO, PLANS.MAIL_PRO] as const)(
        'hides the page from a %s organization',
        (plan) => {
            expect(getAvailability({ plans: [plan] })).toBe(false);
        }
    );

    it('hides the page when B2BAlwaysOnEnabled is off', () => {
        expect(getAvailability({ plans: [PLANS.VPN_BUSINESS], isAlwaysOnVpnEnabled: false })).toBe(false);
    });

    it('hides the page without account.always_on.read', () => {
        expect(getAvailability({ plans: [PLANS.VPN_BUSINESS], canReadAlwaysOn: false })).toBe(false);
    });
});
