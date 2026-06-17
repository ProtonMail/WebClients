import type { CheckSubscriptionData } from '../../../core/api/api';
import { ADDON_NAMES, COUPON_CODES, CYCLE, PLANS } from '../../../core/constants';
import type { PlansMap } from '../../../core/plan/interface';
import type { SubscriptionEstimation } from '../../../core/subscription/interface';
import { getStaticCouponConfig } from '../../coupon-config/get-static-coupon-config';
import type { CouponConfig } from '../../coupon-config/interface';
import { enrichMockCouponDiscountBreakdown } from '../../coupon-config/mock-coupon-discount-breakdown';
import { createHeadlessCheckoutContextInner, getHeadlessCheckout } from '../get-headless-checkout';
import { createAddonItem } from './addons';
import { defaultApp as app, makeAddon, makeCheckResult, makePlan, makePricing } from './test-helpers';

// Decouple the integration test from live coupon configs: it supplies its own mockCouponDiscountBreakdown so it
// exercises the breakdown→checkout pipeline, not whatever data a real campaign config happens to carry.
jest.mock('../../coupon-config/get-static-coupon-config', () => ({
    getStaticCouponConfig: jest.fn(),
}));

const mockBreakdownConfig = {
    mockCouponDiscountBreakdown: {
        EUR: {
            [CYCLE.YEARLY]: [
                { Name: PLANS.BUNDLE, Amount: -4200 },
                { Name: ADDON_NAMES.LUMO_BUNDLE, Amount: -2400 },
            ],
        },
    },
} as unknown as CouponConfig;

beforeEach(() => {
    jest.mocked(getStaticCouponConfig).mockImplementation((couponCode) =>
        couponCode === COUPON_CODES.JUNE26BUNDLESALE ? mockBreakdownConfig : undefined
    );
});

const bundleProPlan = makePlan({
    Name: PLANS.BUNDLE_PRO_2024,
    Title: 'Business',
    MaxMembers: 1,
    Pricing: makePricing(1299, 13188, 23976),
    DefaultPricing: makePricing(1299, 13188, 23976),
});

const bundleProMember = makeAddon({
    Name: ADDON_NAMES.MEMBER_BUNDLE_PRO_2024,
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
    [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: bundleProMember,
    [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: bundleProDomain,
};

describe('createAddonItem', () => {
    it('builds an addons line item directly from the checkout context', () => {
        const checkResult = makeCheckResult({
            Amount: 13188 + 1680,
            AmountDue: 13188 + 1680,
            Cycle: CYCLE.YEARLY,
        });

        const ctx = createHeadlessCheckoutContextInner({
            planIDs: { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 1 },
            plansMap: bundleProPlansMap,
            checkResult,
            app,
        });

        const item = createAddonItem(ctx);

        expect(item.type).toBe('addons');
        expect(item.visible).toBe(true);

        const domainAddon = item.addons.find((a) => a.addonName === ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024)!;
        expect(domainAddon).toBeDefined();
        expect(domainAddon.quantity).toBe(1);
        expect(domainAddon.pricePerOnePerMonth).toBe(1680 / CYCLE.YEARLY);
        // monthly 150, yearly 1680 → baseline 150*12 = 1800, paid 1680 over the cycle.
        expect(domainAddon.withoutDiscountPerMonth).toBe(150);
        expect(domainAddon.withoutDiscountPerCycle).toBe(1800);
        expect(domainAddon.withDiscountPerCycle).toBe(1680);
        expect(domainAddon.withDiscountPerMonth).toBe(140);
        expect(domainAddon.discountPerCycle).toBe(120);
        expect(domainAddon.discountPercent).toBe(7);
    });

    it('is not visible when the plan has no addons', () => {
        const checkResult = makeCheckResult({ Amount: 13188, AmountDue: 13188, Cycle: CYCLE.YEARLY });

        const ctx = createHeadlessCheckoutContextInner({
            planIDs: { [PLANS.BUNDLE_PRO_2024]: 1 },
            plansMap: bundleProPlansMap,
            checkResult,
            app,
        });

        const item = createAddonItem(ctx);

        expect(item.type).toBe('addons');
        expect(item.visible).toBe(false);
        expect(item.addons).toEqual([]);
    });

    it('applies the addon coupon share from the breakdown on top of the term saving', () => {
        const checkResult = makeCheckResult({
            Amount: 13188 + 1680,
            AmountDue: 13188 + 1680 - 1240,
            Cycle: CYCLE.YEARLY,
            CouponDiscount: -1240,
            Coupon: {
                Code: 'SALE',
                Description: '',
                MaximumRedemptionsPerUser: null,
                CouponDiscountBreakdown: [
                    { Name: PLANS.BUNDLE_PRO_2024, Amount: -1000 },
                    { Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024, Amount: -240 },
                ],
            },
        });

        const ctx = createHeadlessCheckoutContextInner({
            planIDs: { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 1 },
            plansMap: bundleProPlansMap,
            checkResult,
            couponConfig: { hidden: true },
            app,
        });

        const domainAddon = createAddonItem(ctx).addons.find(
            (a) => a.addonName === ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024
        )!;

        // -240 coupon over the cycle on top of the 1680 term price → 1440 paid.
        expect(domainAddon.withoutDiscountPerCycle).toBe(1800);
        expect(domainAddon.withDiscountPerCycle).toBe(1440);
        expect(domainAddon.withDiscountPerMonth).toBe(120);
        // Hidden coupon → the displayed line price already carries the coupon share.
        expect(domainAddon.priceForAllPerMonth).toBe(120);
        expect(domainAddon.pricePerOnePerMonth).toBe(120);
        expect(domainAddon.discountPerCycle).toBe(360);
        expect(domainAddon.discountPercent).toBe(20);
    });

    it('keeps the displayed addon price undiscounted when the coupon is shown as a separate line', () => {
        const checkResult = makeCheckResult({
            Amount: 13188 + 1680,
            AmountDue: 13188 + 1680 - 1240,
            Cycle: CYCLE.YEARLY,
            CouponDiscount: -1240,
            Coupon: {
                Code: 'SALE',
                Description: '',
                MaximumRedemptionsPerUser: null,
                CouponDiscountBreakdown: [
                    { Name: PLANS.BUNDLE_PRO_2024, Amount: -1000 },
                    { Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024, Amount: -240 },
                ],
            },
        });

        const ctx = createHeadlessCheckoutContextInner({
            planIDs: { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 1 },
            plansMap: bundleProPlansMap,
            checkResult,
            couponConfig: { hidden: false },
            app,
        });

        const domainAddon = createAddonItem(ctx).addons.find(
            (a) => a.addonName === ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024
        )!;

        // Coupon shown separately → the line displays the undiscounted term price (1680/yr → 140/mo)...
        expect(domainAddon.priceForAllPerMonth).toBe(140);
        expect(domainAddon.pricePerOnePerMonth).toBe(140);
        // ...while the withDiscount* fields still reflect the coupon share for callers that need it.
        expect(domainAddon.withDiscountPerCycle).toBe(1440);
        expect(domainAddon.withDiscountPerMonth).toBe(120);
        expect(domainAddon.discountPerCycle).toBe(360);
        expect(domainAddon.discountPercent).toBe(20);
    });
});

describe('addons line item via getHeadlessCheckout', () => {
    it('includes addon items with correct pricing', () => {
        const checkResult = makeCheckResult({
            Amount: 13188 + 1680,
            AmountDue: 13188 + 1680,
            Cycle: CYCLE.YEARLY,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 1 },
            plansMap: bundleProPlansMap,
            checkResult,
            app,
        });

        const addonsItem = result.getItem('addons');
        expect(addonsItem.addons.length).toBeGreaterThan(0);
        expect(addonsItem.visible).toBe(true);

        const domainAddon = addonsItem.addons.find((a) => a.addonName === ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024);
        expect(domainAddon).toBeDefined();
        expect(domainAddon!.pricePerOnePerMonth).toBe(1680 / CYCLE.YEARLY);
    });

    it('exposes per-addon discount fields reflecting only the term saving when there is no coupon', () => {
        const checkResult = makeCheckResult({
            Amount: 13188 + 1680,
            AmountDue: 13188 + 1680,
            Cycle: CYCLE.YEARLY,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.BUNDLE_PRO_2024]: 1, [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 1 },
            plansMap: bundleProPlansMap,
            checkResult,
            app,
        });

        const domainAddon = result
            .getItem('addons')
            .addons.find((a) => a.addonName === ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024)!;

        expect(domainAddon.withoutDiscountPerMonth).toBe(150);
        expect(domainAddon.withoutDiscountPerCycle).toBe(1800);
        expect(domainAddon.withDiscountPerCycle).toBe(1680);
        expect(domainAddon.withDiscountPerMonth).toBe(140);
        expect(domainAddon.discountPerCycle).toBe(120);
        expect(domainAddon.discountPercent).toBe(7);
    });
});

/**
 * End-to-end simulation of the Summer Sale bundle deal: a real backend-style check response (carrying only the
 * aggregate CouponDiscount) is enriched from the coupon's mock breakdown, then run through the headless
 * checkout so the members and addon line items show the per-line discounted prices.
 *
 * Summer deal mock for EUR/YEARLY (see summerSale2026bundle.tsx): bundle -4200, lumo -2400 → total -6600.
 */
describe('Summer Sale bundle deal (integration)', () => {
    // EUR yearly: Proton Unlimited 119.88, Lumo addon 119.88.
    const bundlePlan = makePlan({
        Name: PLANS.BUNDLE,
        Title: 'Proton Unlimited',
        MaxMembers: 1,
        Pricing: makePricing(1299, 11988),
        DefaultPricing: makePricing(1299, 11988),
    });

    const lumoBundleAddon = makeAddon({
        Name: ADDON_NAMES.LUMO_BUNDLE,
        Pricing: makePricing(999, 11988),
        DefaultPricing: makePricing(999, 11988),
    });

    const plansMap: PlansMap = {
        [PLANS.BUNDLE]: bundlePlan,
        [ADDON_NAMES.LUMO_BUNDLE]: lumoBundleAddon,
    };

    const planIDs = { [PLANS.BUNDLE]: 1, [ADDON_NAMES.LUMO_BUNDLE]: 1 };

    it('enriches the yearly estimation and discounts every line item', () => {
        const data: CheckSubscriptionData = {
            Plans: planIDs,
            Currency: 'EUR',
            Cycle: CYCLE.YEARLY,
            CouponCode: COUPON_CODES.JUNE26BUNDLESALE,
        };

        // Backend-style response: aggregate discount only, no breakdown.
        const checkResult: SubscriptionEstimation = makeCheckResult({
            Amount: 23976, // 11988 + 11988
            AmountDue: 17376, // 23976 - 6600
            Cycle: CYCLE.YEARLY,
            Currency: 'EUR',
            CouponDiscount: -6600,
            Coupon: { Code: COUPON_CODES.JUNE26BUNDLESALE, Description: '', MaximumRedemptionsPerUser: null },
            requestData: data,
        });

        enrichMockCouponDiscountBreakdown(checkResult, data);

        // The mock breakdown, filtered to the requested plans, is now on the response.
        expect(checkResult.Coupon?.CouponDiscountBreakdown).toEqual([
            { Name: PLANS.BUNDLE, Amount: -4200 },
            { Name: ADDON_NAMES.LUMO_BUNDLE, Amount: -2400 },
        ]);

        const result = getHeadlessCheckout({ planIDs, plansMap, checkResult, couponConfig: { hidden: true }, app });

        // Base plan: 119.88/yr full → 9.99/mo, minus 42.00/yr coupon → -3.50/mo = 6.49/mo discounted.
        const members = result.getItem('members');
        expect(members.pricePerAllPerMonth).toBe(649);

        // Lumo addon: 119.88/yr full → minus 24.00/yr coupon → 95.88/yr = 7.99/mo discounted.
        const lumoAddon = result.getItem('addons').addons.find((a) => a.addonName === ADDON_NAMES.LUMO_BUNDLE)!;
        expect(lumoAddon.withDiscountPerCycle).toBe(9588);
        expect(lumoAddon.withDiscountPerMonth).toBe(799);
        expect(lumoAddon.priceForAllPerMonth).toBe(799);
        expect(lumoAddon.discountPerCycle).toBe(2400);
        expect(lumoAddon.discountPercent).toBe(20);

        // The discounted line items reconcile with the amount the user actually pays.
        expect(members.pricePerAllPerMonth * CYCLE.YEARLY + lumoAddon.withDiscountPerCycle).toBe(checkResult.AmountDue);
    });

    it('leaves monthly checkouts untouched (the deal is yearly-only)', () => {
        const data: CheckSubscriptionData = {
            Plans: planIDs,
            Currency: 'EUR',
            Cycle: CYCLE.MONTHLY,
            CouponCode: COUPON_CODES.JUNE26BUNDLESALE,
        };

        const checkResult: SubscriptionEstimation = makeCheckResult({
            Amount: 2298, // 1299 + 999
            AmountDue: 2298,
            Cycle: CYCLE.MONTHLY,
            Currency: 'EUR',
            CouponDiscount: 0,
            requestData: data,
        });

        enrichMockCouponDiscountBreakdown(checkResult, data);

        // No mock for the monthly cycle → nothing injected.
        expect(checkResult.Coupon?.CouponDiscountBreakdown).toBeUndefined();

        const result = getHeadlessCheckout({ planIDs, plansMap, checkResult, couponConfig: { hidden: true }, app });

        const lumoAddon = result.getItem('addons').addons.find((a) => a.addonName === ADDON_NAMES.LUMO_BUNDLE)!;
        expect(lumoAddon.withDiscountPerMonth).toBe(999);
        expect(lumoAddon.discountPerCycle).toBe(0);
        expect(lumoAddon.discountPercent).toBe(0);
    });
});
