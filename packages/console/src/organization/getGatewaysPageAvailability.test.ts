import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';

import { getGatewaysPageAvailability } from './getGatewaysPageAvailability';

const getAvailability = ({ plans, canReadGateways = true }: { plans: CataloguedPlan[]; canReadGateways?: boolean }) =>
    getGatewaysPageAvailability({
        entitlements: buildOrgAndUserEntitlementChecks({ subscriptionPlans: plans }),
        permissions: { 'account.gateway.read': canReadGateways },
    });

describe('getGatewaysPageAvailability', () => {
    it.each([PLANS.VPN_BUSINESS, PLANS.VPN_PRO, PLANS.BUNDLE_PRO_2024] as const)(
        'shows the page to a %s organization',
        (plan) => {
            expect(getAvailability({ plans: [plan] }).gateways).toBe(true);
        }
    );

    it.each([PLANS.PASS_BUSINESS, PLANS.PASS_PRO, PLANS.MAIL_PRO] as const)(
        'hides the page from a %s organization',
        (plan) => {
            expect(getAvailability({ plans: [plan] }).gateways).toBe(false);
        }
    );

    it('hides the page from a consumer VPN subscription', () => {
        expect(getAvailability({ plans: [PLANS.VPN2024] }).gateways).toBe(false);
    });

    it('hides the page without account.gateway.read', () => {
        expect(getAvailability({ plans: [PLANS.VPN_BUSINESS], canReadGateways: false }).gateways).toBe(false);
    });
});
