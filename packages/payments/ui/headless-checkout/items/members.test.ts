import { ADDON_NAMES, PLANS } from '../../../core/constants';
import type { PlansMap } from '../../../core/plan/interface';
import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeAddon, makeCheckResult, makePlan, makePricing } from './test-helpers';

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

const bundleProPlan = makePlan({
    Name: PLANS.BUNDLE_PRO_2024,
    Title: 'Business',
    MaxMembers: 1,
    Pricing: makePricing(1299, 13188, 23976),
    DefaultPricing: makePricing(1299, 13188, 23976),
});

const bundleProDomain = makeAddon({
    Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024,
    MaxDomains: 1,
    Pricing: makePricing(150, 1680, 3120),
    DefaultPricing: makePricing(150, 1680, 3120),
});

const bundleProPlansMap: PlansMap = {
    [PLANS.BUNDLE_PRO_2024]: bundleProPlan,
    [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: bundleProDomain,
};

const bundleProWithDomainIDs = { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 1 };

describe('createMembersItem', () => {
    it('should have members item visible', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 4788, AmountDue: 4788 });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const members = result.getItem('members');
        expect(members.visible).toBe(true);
        expect(members.labelWithQuantity).toContain('user');
    });

    it('should use withDiscountPerMonth when coupon is hidden and no addons', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 3788,
            CouponDiscount: -1000,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            couponConfig: { hidden: true },
            app,
        });

        const members = result.getItem('members');
        // No addons + couponConfig.hidden → uses withDiscountPerMonth
        expect(members.pricePerAllPerMonth).toBe(result.checkoutUi.withDiscountPerMonth);
    });

    it('should use membersPerMonth by default', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 4788, AmountDue: 4788 });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const members = result.getItem('members');
        expect(members.pricePerAllPerMonth).toBe(result.checkoutUi.membersPerMonth);
    });

    it('subtracts the base-plan breakdown share when coupon is hidden and addons are present', () => {
        const checkResult = makeCheckResult({
            Amount: 13188 + 1680,
            AmountDue: 13188 + 1680 - 1440,
            CouponDiscount: -1440,
            Coupon: {
                Code: 'SALE',
                Description: '',
                MaximumRedemptionsPerUser: null,
                CouponDiscountBreakdown: [
                    { Name: PLANS.BUNDLE_PRO_2024, Amount: -1200 },
                    { Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024, Amount: -240 },
                ],
            },
        });

        const result = getHeadlessCheckout({
            planIDs: bundleProWithDomainIDs,
            plansMap: bundleProPlansMap,
            checkResult,
            couponConfig: { hidden: true },
            app,
        });

        const members = result.getItem('members');
        // membersPerMonth 13188/12 = 1099, base-plan share -1200/12 = -100 → 999 displayed.
        expect(result.checkoutUi.membersPerMonth).toBe(1099);
        expect(result.checkoutUi.couponDiscountBreakdown?.basePlanPerMonthDiscount).toBe(-100);
        expect(members.pricePerAllPerMonth).toBe(999);
        // Single user → the per-one price tracks the discounted per-all price.
        expect(members.pricePerOnePerMonth).toBe(999);
    });

    it('keeps the full members price when coupon is hidden, addons are present, but no breakdown is provided', () => {
        const checkResult = makeCheckResult({
            Amount: 13188 + 1680,
            AmountDue: 13188 + 1680 - 1440,
            CouponDiscount: -1440,
            Coupon: { Code: 'SALE', Description: '', MaximumRedemptionsPerUser: null },
        });

        const result = getHeadlessCheckout({
            planIDs: bundleProWithDomainIDs,
            plansMap: bundleProPlansMap,
            checkResult,
            couponConfig: { hidden: true },
            app,
        });

        const members = result.getItem('members');
        // No breakdown → neither legacy branch applies, so the undiscounted members price is shown.
        expect(result.checkoutUi.couponDiscountBreakdown).toBeUndefined();
        expect(members.pricePerAllPerMonth).toBe(result.checkoutUi.membersPerMonth);
        expect(members.pricePerOnePerMonth).toBe(result.checkoutUi.oneMemberPerMonth);
    });
});
