import { getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { PLANS_MAP } from '@proton/payments/testing/data-plans';

import type { SubscriptionData } from '../signup/interfaces';
import type { SubscriptionDataCycleMapping } from '../single-signup-v2/helper';
import { getVpnPassBundleUpsellMonthlyPrice } from './helper';

const plansMap = PLANS_MAP as PlansMap;

const checkResult = (
    plan: PLANS.VPN2024 | PLANS.VPN_PASS_BUNDLE,
    cycle: CYCLE,
    currency: Currency,
    overrides: Partial<SubscriptionEstimation> = {}
): SubscriptionEstimation => ({
    ...getOptimisticCheckResult({ planIDs: { [plan]: 1 }, plansMap, cycle, currency }),
    ...overrides,
});

const mapping = (entries: Partial<Record<PLANS, Partial<Record<CYCLE, SubscriptionEstimation>>>>) => {
    const result: SubscriptionDataCycleMapping = {};
    for (const [plan, byCycle] of Object.entries(entries)) {
        result[plan as PLANS] = Object.fromEntries(
            Object.entries(byCycle ?? {}).map(([cycle, cr]) => [cycle, { checkResult: cr } as SubscriptionData])
        ) as SubscriptionDataCycleMapping[PLANS];
    }
    return result;
};

// Catalog list prices from PLANS_MAP: vpn2024 {1:999, 12:7995}, vpnpass2023 {1:1099, 12:10395}
const CATALOG_MONTHLY_DELTA = 1099 - 999; // 100
const CATALOG_YEARLY_DELTA = (10395 - 7995) / 12; // 200

describe('getVpnPassBundleUpsellMonthlyPrice', () => {
    it('returns the coupon-adjusted per-month delta when both discounted checks are present (yearly)', () => {
        const subscriptionDataCycleMapping = mapping({
            // 7995 - 1995 = 6000 net -> 500/mo
            [PLANS.VPN2024]: {
                [CYCLE.YEARLY]: checkResult(PLANS.VPN2024, CYCLE.YEARLY, 'EUR', {
                    Amount: 7995,
                    CouponDiscount: -1995,
                }),
            },
            // 10395 - 2395 = 8000 net -> 666.67/mo
            [PLANS.VPN_PASS_BUNDLE]: {
                [CYCLE.YEARLY]: checkResult(PLANS.VPN_PASS_BUNDLE, CYCLE.YEARLY, 'EUR', {
                    Amount: 10395,
                    CouponDiscount: -2395,
                }),
            },
        });

        const price = getVpnPassBundleUpsellMonthlyPrice({
            cycle: CYCLE.YEARLY,
            currency: 'EUR',
            plansMap,
            subscriptionDataCycleMapping,
        });

        expect(price).toBeCloseTo(2000 / 12); // 166.67
        expect(price).not.toBeCloseTo(CATALOG_YEARLY_DELTA); // differs from the list-price delta
    });

    it('equals the catalog delta on monthly cycle (no auto-coupon)', () => {
        const subscriptionDataCycleMapping = mapping({
            [PLANS.VPN2024]: {
                [CYCLE.MONTHLY]: checkResult(PLANS.VPN2024, CYCLE.MONTHLY, 'EUR', { Amount: 999, CouponDiscount: 0 }),
            },
            [PLANS.VPN_PASS_BUNDLE]: {
                [CYCLE.MONTHLY]: checkResult(PLANS.VPN_PASS_BUNDLE, CYCLE.MONTHLY, 'EUR', {
                    Amount: 1099,
                    CouponDiscount: 0,
                }),
            },
        });

        const price = getVpnPassBundleUpsellMonthlyPrice({
            cycle: CYCLE.MONTHLY,
            currency: 'EUR',
            plansMap,
            subscriptionDataCycleMapping,
        });

        expect(price).toBeCloseTo(CATALOG_MONTHLY_DELTA);
    });

    it('falls back to the catalog delta when the bundle check is missing', () => {
        const subscriptionDataCycleMapping = mapping({
            [PLANS.VPN2024]: {
                [CYCLE.YEARLY]: checkResult(PLANS.VPN2024, CYCLE.YEARLY, 'EUR', {
                    Amount: 7995,
                    CouponDiscount: -1995,
                }),
            },
        });

        const price = getVpnPassBundleUpsellMonthlyPrice({
            cycle: CYCLE.YEARLY,
            currency: 'EUR',
            plansMap,
            subscriptionDataCycleMapping,
        });

        expect(price).toBeCloseTo(CATALOG_YEARLY_DELTA);
    });

    it('falls back to the catalog delta when a check result currency is stale', () => {
        const subscriptionDataCycleMapping = mapping({
            [PLANS.VPN2024]: {
                [CYCLE.YEARLY]: checkResult(PLANS.VPN2024, CYCLE.YEARLY, 'CHF', {
                    Amount: 7995,
                    CouponDiscount: -1995,
                }),
            },
            [PLANS.VPN_PASS_BUNDLE]: {
                [CYCLE.YEARLY]: checkResult(PLANS.VPN_PASS_BUNDLE, CYCLE.YEARLY, 'CHF', {
                    Amount: 10395,
                    CouponDiscount: -2395,
                }),
            },
        });

        const price = getVpnPassBundleUpsellMonthlyPrice({
            cycle: CYCLE.YEARLY,
            currency: 'EUR', // requested currency differs from the cached entries
            plansMap,
            subscriptionDataCycleMapping,
        });

        expect(price).toBeCloseTo(CATALOG_YEARLY_DELTA);
    });

    it('falls back to the catalog delta when there is no mapping', () => {
        const price = getVpnPassBundleUpsellMonthlyPrice({
            cycle: CYCLE.YEARLY,
            currency: 'EUR',
            plansMap,
            subscriptionDataCycleMapping: undefined,
        });

        expect(price).toBeCloseTo(CATALOG_YEARLY_DELTA);
    });
});
