import type { CheckSubscriptionData } from '../../../core/api/api';
import { ADDON_NAMES, CYCLE, PLANS } from '../../../core/constants';
import type { PlansMap } from '../../../core/plan/interface';
import type { SubscriptionEstimation } from '../../../core/subscription/interface';
import { getStaticCouponConfig } from '../../coupon-config/get-static-coupon-config';
import type { CouponConfig } from '../../coupon-config/interface';
import { enrichMockCouponDiscountBreakdown } from '../../coupon-config/mock-coupon-discount-breakdown';
import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeAddon, makeCheckResult, makePlan, makePricing } from './test-helpers';

// Decouple the integration test from live (short-lived) campaign configs: mock getStaticCouponConfig and supply
// a test-only hidden coupon, so removing a real summer-sale config never breaks this test.
jest.mock('../../coupon-config/get-static-coupon-config', () => ({
    getStaticCouponConfig: jest.fn(),
}));

const HIDDEN_SALE_COUPON = 'TEST-HIDDEN-SALE';

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

    it('shows Duo at 11.99/mo and Lumo at 9.99/mo for a hidden summer-sale coupon', () => {
        // Test-only hidden coupon, standing in for a short-lived campaign config (e.g. summer sale).
        jest.mocked(getStaticCouponConfig).mockImplementation((couponCode) =>
            couponCode === HIDDEN_SALE_COUPON ? ({ hidden: true } as unknown as CouponConfig) : undefined
        );

        // Duo (multi-user personal, 2 seats): 179.88/yr → 14.99/mo for the whole plan.
        const duoPlan = makePlan({
            Name: PLANS.DUO,
            Title: 'Proton Duo',
            MaxMembers: 2,
            Pricing: makePricing(2399, 17988),
            DefaultPricing: makePricing(2399, 17988),
        });
        // Lumo Duo add-on: 119.88/yr → 9.99/mo. The hidden coupon does not discount the add-on line.
        const lumoDuoAddon = makeAddon({
            Name: ADDON_NAMES.LUMO_DUO,
            Pricing: makePricing(999, 11988),
            DefaultPricing: makePricing(999, 11988),
        });

        const plansMap: PlansMap = { [PLANS.DUO]: duoPlan, [ADDON_NAMES.LUMO_DUO]: lumoDuoAddon };
        const planIDs = { [PLANS.DUO]: 1, [ADDON_NAMES.LUMO_DUO]: 1 };

        const data: CheckSubscriptionData = {
            Codes: [HIDDEN_SALE_COUPON],
            Plans: planIDs,
            Currency: 'USD',
            Cycle: CYCLE.YEARLY,
            BillingAddress: { CountryCode: 'CH', State: null, ZipCode: null },
            IsTrial: false,
        };

        // Verbatim backend response: aggregate -36.00 discount, no per-line breakdown.
        const checkResult: SubscriptionEstimation = makeCheckResult({
            Amount: 29976, // 17988 (Duo) + 11988 (Lumo)
            AmountDue: 14390,
            Proration: -11986,
            CouponDiscount: -3600,
            Currency: 'USD',
            Cycle: CYCLE.YEARLY,
            Coupon: {
                Code: HIDDEN_SALE_COUPON,
                Description: 'Summer sale',
                MaximumRedemptionsPerUser: 1,
            },
            requestData: data,
        });

        // The hidden coupon has no mock breakdown, so the whole discount is attributed to the base plan.
        enrichMockCouponDiscountBreakdown(checkResult, data);
        expect(checkResult.Coupon?.CouponDiscountBreakdown).toEqual([{ Name: PLANS.DUO, Amount: -3600 }]);

        const result = getHeadlessCheckout({
            planIDs,
            plansMap,
            checkResult,
            couponConfig: { hidden: true },
            app,
        });

        // Members: 14.99/mo full minus the base-plan share -3.00/mo → 11.99/mo (the value SubscriptionCheckout renders).
        const members = result.getItem('members');
        expect(result.checkoutUi.membersPerMonth).toBe(1499);
        expect(result.checkoutUi.couponDiscountBreakdown?.basePlanPerMonthDiscount).toBe(-300);
        expect(members.pricePerAllPerMonth).toBe(1199);

        // Lumo add-on keeps its full 9.99/mo because the hidden coupon's discount went entirely to the base plan.
        const lumoAddon = result.getItem('addons').addons.find((a) => a.addonName === ADDON_NAMES.LUMO_DUO)!;
        expect(lumoAddon.priceForAllPerMonth).toBe(999);
        expect(lumoAddon.pricePerOnePerMonth).toBe(999);
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
