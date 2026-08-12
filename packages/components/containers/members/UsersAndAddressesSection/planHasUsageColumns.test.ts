import { PLANS } from '@proton/payments/core/constants';

import { planHasUsageColumns } from './planHasUsageColumns';

const allowedPlans: PLANS[] = [PLANS.VPN_PRO, PLANS.VPN_BUSINESS, PLANS.VPN_PASS_BUNDLE_BUSINESS];

describe('planHasUsageColumns', () => {
    it('allows VPN Essentials, VPN Professional and VPN and Pass Professional', () => {
        allowedPlans.forEach((plan) => {
            expect(planHasUsageColumns(plan)).toBe(true);
        });
    });

    // Enumerating the enum rather than a hand-picked list means a newly added plan has to opt in
    // explicitly, instead of silently inheriting the columns.
    it('excludes every other plan', () => {
        const otherPlans = Object.values(PLANS).filter((plan) => !allowedPlans.includes(plan));

        expect(otherPlans).not.toHaveLength(0);
        otherPlans.forEach((plan) => {
            expect(planHasUsageColumns(plan)).toBe(false);
        });
    });

    it('excludes the Workspace plans that also reach the VPN settings app', () => {
        expect(planHasUsageColumns(PLANS.BUNDLE_PRO_2024)).toBe(false);
        expect(planHasUsageColumns(PLANS.BUNDLE_BIZ_2025)).toBe(false);
        expect(planHasUsageColumns(PLANS.BUNDLE_PRO)).toBe(false);
    });

    // A free organization is a stub without a PlanName, and the organization is undefined while loading.
    it('excludes a missing plan name', () => {
        expect(planHasUsageColumns(undefined)).toBe(false);
    });
});
