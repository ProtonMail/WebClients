import { PLANS_MAP } from '@proton/testing/data';

import { ADDON_NAMES, CYCLE, PLANS } from './constants';
import type { Plan } from './plan/interface';
import { getPriceStartsFrom } from './price-helpers';

describe('getPriceStartsFrom', () => {
    it('should return null if the current plan does not have pricing for the selected cycle', () => {
        const plan = PLANS_MAP[PLANS.VPN_PRO] as Plan;
        expect(getPriceStartsFrom(plan, CYCLE.THIRTY, PLANS_MAP)).toBeNull();
    });

    it('should return cycle price for the current plan', () => {
        const plan = PLANS_MAP[PLANS.FAMILY] as Plan;
        expect(getPriceStartsFrom(plan, CYCLE.TWO_YEARS, PLANS_MAP)).toBe(plan.Pricing[CYCLE.TWO_YEARS]);
    });

    it.each([
        [PLANS.VPN_PRO, ADDON_NAMES.MEMBER_VPN_PRO],
        [PLANS.VPN_BUSINESS, ADDON_NAMES.MEMBER_VPN_BUSINESS],
        [PLANS.PASS_PRO, ADDON_NAMES.MEMBER_PASS_PRO],
        [PLANS.PASS_BUSINESS, ADDON_NAMES.MEMBER_PASS_BUSINESS],
    ])('should return member addon cycle price for the selected plans: %s', (planName, addonName) => {
        const plan = PLANS_MAP[planName] as Plan;
        const addon = PLANS_MAP[addonName] as Plan;

        expect(getPriceStartsFrom(plan, CYCLE.TWO_YEARS, PLANS_MAP)).toBe(addon.Pricing[CYCLE.TWO_YEARS]);
    });

    it('should return the plan pricing if the addon is not available', () => {
        const plan = PLANS_MAP[PLANS.VPN_PRO] as Plan;

        const plansMap = {
            ...PLANS_MAP,
            [ADDON_NAMES.MEMBER_VPN_PRO]: undefined,
        };

        expect(getPriceStartsFrom(plan, CYCLE.TWO_YEARS, plansMap)).toBe(plan.Pricing[CYCLE.TWO_YEARS]);
    });
});
