import { ADDON_NAMES, CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Cycle, PlanIDs } from '@proton/payments/core/interface';
import type { PlansMap } from '@proton/shared/lib/payments/plan/interface';

import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeAddon, makeCheckResult, makePlan, makePricing } from './test-helpers';

const duoPlansMap: PlansMap = {
    [PLANS.DUO]: makePlan({
        Name: PLANS.DUO,
        Title: 'Proton Duo',
        MaxMembers: 2,
        Pricing: makePricing(1999, 17988),
        DefaultPricing: makePricing(1999, 17988),
    }),
    [ADDON_NAMES.LUMO_DUO]: makeAddon({
        Name: ADDON_NAMES.LUMO_DUO,
        Pricing: makePricing(2499, 23988),
        DefaultPricing: makePricing(2499, 23988),
    }),
};

const businessPlansMap: PlansMap = {
    [PLANS.BUNDLE_PRO_2024]: makePlan({
        Name: PLANS.BUNDLE_PRO_2024,
        Title: 'Business',
        MaxMembers: 1,
        Pricing: makePricing(1299, 13188),
        DefaultPricing: makePricing(1299, 13188),
    }),
    [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: makeAddon({
        Name: ADDON_NAMES.MEMBER_BUNDLE_PRO_2024,
        MaxMembers: 1,
        Pricing: makePricing(1299, 13188),
        DefaultPricing: makePricing(1299, 13188),
    }),
    [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: makeAddon({
        Name: ADDON_NAMES.LUMO_BUNDLE_PRO_2024,
        Pricing: makePricing(1199, 11988),
        DefaultPricing: makePricing(1199, 11988),
    }),
};

const duoWithLumo = { [PLANS.DUO]: 1, [ADDON_NAMES.LUMO_DUO]: 1 };
const duoWithLumoYearlyAmount = 17988 + 23988;

const businessWithMembersAndLumo = {
    [PLANS.BUNDLE_PRO_2024]: 1,
    [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 2,
    [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 1,
};
const businessWithMembersAndLumoYearlyAmount = 3 * 13188 + 11988;

const getPlanBadge = ({
    planIDs,
    plansMap,
    cycle = CYCLE.YEARLY,
    amount,
    breakdown,
    hidden,
}: {
    planIDs: PlanIDs;
    plansMap: PlansMap;
    cycle?: Cycle;
    amount: number;
    breakdown: { Name: string; Amount: number }[];
    hidden: boolean;
}) => {
    const couponDiscount = breakdown.reduce((acc, { Amount }) => acc + Amount, 0);
    const checkResult = makeCheckResult({
        Amount: amount,
        AmountDue: amount + couponDiscount,
        Cycle: cycle,
        Currency: 'EUR',
        CouponDiscount: couponDiscount,
        Coupon: couponDiscount ? { Code: 'BF2026BUNDLE', Description: '', MaximumRedemptionsPerUser: 1 } : null,
        CouponDiscountBreakdown: breakdown,
    });

    const checkout = getHeadlessCheckout({ planIDs, plansMap, checkResult, couponConfig: { hidden }, app });
    const { visible, discountPercent, formattedDiscount } = checkout.getItem('planDiscount');

    return {
        visible,
        discountPercent,
        formattedDiscount,
        wholeCheckoutPercent: checkout.getItem('discount').discountPercent,
    };
};

describe('planDiscount item', () => {
    it('shows the base plan discount when a hidden coupon discounts only the base plan', () => {
        expect(
            getPlanBadge({
                planIDs: duoWithLumo,
                plansMap: duoPlansMap,
                amount: duoWithLumoYearlyAmount,
                breakdown: [
                    { Name: PLANS.DUO, Amount: -3600 },
                    { Name: ADDON_NAMES.LUMO_DUO, Amount: 0 },
                ],
                hidden: true,
            })
        ).toEqual({ visible: true, discountPercent: 40, formattedDiscount: '-40%', wholeCheckoutPercent: 29 });
    });

    it('keeps the whole-checkout discount when the coupon is not hidden', () => {
        expect(
            getPlanBadge({
                planIDs: duoWithLumo,
                plansMap: duoPlansMap,
                amount: duoWithLumoYearlyAmount,
                breakdown: [
                    { Name: PLANS.DUO, Amount: -3600 },
                    { Name: ADDON_NAMES.LUMO_DUO, Amount: 0 },
                ],
                hidden: false,
            })
        ).toEqual({ visible: true, discountPercent: 29, formattedDiscount: '-29%', wholeCheckoutPercent: 29 });
    });

    it('keeps the whole-checkout discount when the hidden coupon gives no discount', () => {
        expect(
            getPlanBadge({
                planIDs: duoWithLumo,
                plansMap: duoPlansMap,
                amount: duoWithLumoYearlyAmount,
                breakdown: [
                    { Name: PLANS.DUO, Amount: 0 },
                    { Name: ADDON_NAMES.LUMO_DUO, Amount: 0 },
                ],
                hidden: true,
            })
        ).toEqual({ visible: true, discountPercent: 22, formattedDiscount: '-22%', wholeCheckoutPercent: 22 });
    });

    it('shows only the billing cycle saving of the base plan when a hidden coupon discounts only the addon', () => {
        expect(
            getPlanBadge({
                planIDs: duoWithLumo,
                plansMap: duoPlansMap,
                amount: duoWithLumoYearlyAmount,
                breakdown: [
                    { Name: PLANS.DUO, Amount: 0 },
                    { Name: ADDON_NAMES.LUMO_DUO, Amount: -4800 },
                ],
                hidden: true,
            })
        ).toMatchObject({ visible: true, discountPercent: 25 });
    });

    it('hides the badge on a monthly cycle when a hidden coupon discounts only the addon', () => {
        expect(
            getPlanBadge({
                planIDs: duoWithLumo,
                plansMap: duoPlansMap,
                cycle: CYCLE.MONTHLY,
                amount: 1999 + 2499,
                breakdown: [
                    { Name: PLANS.DUO, Amount: 0 },
                    { Name: ADDON_NAMES.LUMO_DUO, Amount: -1000 },
                ],
                hidden: true,
            })
        ).toMatchObject({ visible: false, discountPercent: 0 });
    });

    it('counts member addons with the base plan when a hidden coupon discounts them', () => {
        expect(
            getPlanBadge({
                planIDs: businessWithMembersAndLumo,
                plansMap: businessPlansMap,
                amount: businessWithMembersAndLumoYearlyAmount,
                breakdown: [
                    { Name: PLANS.BUNDLE_PRO_2024, Amount: -2000 },
                    { Name: ADDON_NAMES.MEMBER_BUNDLE_PRO_2024, Amount: -4000 },
                    { Name: ADDON_NAMES.LUMO_BUNDLE_PRO_2024, Amount: 0 },
                ],
                hidden: true,
            })
        ).toEqual({ visible: true, discountPercent: 28, formattedDiscount: '-28%', wholeCheckoutPercent: 26 });
    });

    it('leaves the addon share out of the badge when a hidden coupon discounts every line', () => {
        expect(
            getPlanBadge({
                planIDs: businessWithMembersAndLumo,
                plansMap: businessPlansMap,
                amount: businessWithMembersAndLumoYearlyAmount,
                breakdown: [
                    { Name: PLANS.BUNDLE_PRO_2024, Amount: -2000 },
                    { Name: ADDON_NAMES.MEMBER_BUNDLE_PRO_2024, Amount: -4000 },
                    { Name: ADDON_NAMES.LUMO_BUNDLE_PRO_2024, Amount: -2400 },
                ],
                hidden: true,
            })
        ).toEqual({ visible: true, discountPercent: 28, formattedDiscount: '-28%', wholeCheckoutPercent: 29 });
    });
});
