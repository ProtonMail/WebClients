import { CYCLE, PLANS } from '@proton/payments';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';

import type { CouponConfig, CouponConfigProps } from './interface';
import { matchCouponConfig } from './useCouponConfig';

const testMonthlyNudgeConfig: CouponConfig = {
    coupons: ['ANNUALOFFER25'],
    hidden: true,
    cyclePriceCompare: undefined,
    cycleTitle: undefined,
};

const testBf2025Config: CouponConfig = {
    coupons: [
        'BF25PROMO',
        'BF25PROMO1M',
        'BF25BUNDLEPROMO',
        'BF25LIGHTNING',
        'BF25LUMOADDON',
        'BF25LUMOADDONPROMO',
        'BF25DEALPD',
        'BF25DEALVM',
        'BF25PROMO24',
    ],
    specialCases: [
        {
            planName: PLANS.VPN2024,
            cycle: CYCLE.FIFTEEN,
        },
    ],
    hidden: true,
    cyclePriceComparePosition: 'before',
    showMigrationDiscountLossWarning: true,
    hideLumoAddonBanner: true,
};

const testCouponConfigs: CouponConfig[] = [testMonthlyNudgeConfig, testBf2025Config];

describe('matchCouponConfig', () => {
    it('returns undefined when required props are missing', () => {
        const config: CouponConfigProps = {
            checkResult: undefined,
            planIDs: {},
            plansMap: {},
        };

        expect(matchCouponConfig(config, testCouponConfigs)).toBeUndefined();
    });

    it('matches config by coupon code (monthlyNudgeConfig)', () => {
        const checkResult: SubscriptionEstimation = {
            Amount: 9999,
            AmountDue: 7499,
            Coupon: {
                Code: 'ANNUALOFFER25',
                Description: 'Annual offer 25% discount',
                MaximumRedemptionsPerUser: 1,
            },
            CouponDiscount: 2500,
            Currency: 'USD',
            Cycle: CYCLE.YEARLY,
            PeriodEnd: 1735689600,
            SubscriptionMode: 0,
            BaseRenewAmount: 9999,
            RenewCycle: CYCLE.YEARLY,
            requestData: {
                Plans: { [PLANS.MAIL]: 1 },
                Currency: 'USD',
                Cycle: CYCLE.YEARLY,
            },
        };

        const config: CouponConfigProps = {
            checkResult,
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap: {},
        };

        const result = matchCouponConfig(config, testCouponConfigs);
        expect(result).toBeDefined();
        expect(result?.coupons).toEqual(testMonthlyNudgeConfig.coupons);
        expect(result?.hidden).toBe(testMonthlyNudgeConfig.hidden);
    });

    it('matches config by special case when coupon code is missing (bf2025Config)', () => {
        const checkResult: SubscriptionEstimation = {
            Amount: 14999,
            AmountDue: 11999,
            Coupon: null,
            Currency: 'USD',
            Cycle: CYCLE.FIFTEEN,
            PeriodEnd: 1767225600,
            SubscriptionMode: 0,
            BaseRenewAmount: 14999,
            RenewCycle: CYCLE.FIFTEEN,
            requestData: {
                Plans: { [PLANS.VPN2024]: 1 },
                Currency: 'USD',
                Cycle: CYCLE.FIFTEEN,
            },
        };

        const config: CouponConfigProps = {
            checkResult,
            planIDs: { [PLANS.VPN2024]: 1 },
            plansMap: {},
        };

        const result = matchCouponConfig(config, testCouponConfigs);
        expect(result).toBeDefined();
        expect(result?.coupons).toEqual(testBf2025Config.coupons);
        expect(result?.hidden).toBe(testBf2025Config.hidden);
        expect(result?.specialCases).toEqual(testBf2025Config.specialCases);
    });

    it('matches Black Friday 2025 coupon', () => {
        const checkResult: SubscriptionEstimation = {
            Amount: 29999,
            AmountDue: 17999,
            Coupon: {
                Code: 'BF25PROMO',
                Description: 'Black Friday 2025 deal',
                MaximumRedemptionsPerUser: 1,
            },
            CouponDiscount: 12000,
            Currency: 'USD',
            Cycle: CYCLE.YEARLY,
            PeriodEnd: 1735689600,
            SubscriptionMode: 0,
            BaseRenewAmount: 29999,
            RenewCycle: CYCLE.YEARLY,
            requestData: {
                Plans: { [PLANS.BUNDLE]: 1 },
                Currency: 'USD',
                Cycle: CYCLE.YEARLY,
            },
        };

        const config: CouponConfigProps = {
            checkResult,
            planIDs: { [PLANS.BUNDLE]: 1 },
            plansMap: {},
        };

        const result = matchCouponConfig(config, testCouponConfigs);
        expect(result).toBeDefined();
        expect(result?.coupons).toContain('BF25PROMO');
        expect(result?.hidden).toBe(true);
        expect(result?.showMigrationDiscountLossWarning).toBe(true);
    });

    it('matches Black Friday 2025 bundle coupon', () => {
        const checkResult: SubscriptionEstimation = {
            Amount: 47976,
            AmountDue: 23988,
            Coupon: {
                Code: 'BF25BUNDLEPROMO',
                Description: 'Black Friday 2025 Bundle',
                MaximumRedemptionsPerUser: 1,
            },
            CouponDiscount: 23988,
            Currency: 'USD',
            Cycle: CYCLE.TWO_YEARS,
            PeriodEnd: 1798761600,
            SubscriptionMode: 0,
            BaseRenewAmount: 47976,
            RenewCycle: CYCLE.TWO_YEARS,
            requestData: {
                Plans: { [PLANS.BUNDLE]: 1 },
                Currency: 'USD',
                Cycle: CYCLE.TWO_YEARS,
            },
        };

        const config: CouponConfigProps = {
            checkResult,
            planIDs: { [PLANS.BUNDLE]: 1 },
            plansMap: {},
        };

        const result = matchCouponConfig(config, testCouponConfigs);
        expect(result).toBeDefined();
        expect(result?.coupons).toContain('BF25BUNDLEPROMO');
        expect(result?.hidden).toBe(true);
        expect(result?.hideLumoAddonBanner).toBe(true);
    });

    it('returns undefined when no config matches', () => {
        const checkResult: SubscriptionEstimation = {
            Amount: 9999,
            AmountDue: 9999,
            Coupon: {
                Code: 'NONEXISTENT_COUPON',
                Description: 'Unknown coupon',
                MaximumRedemptionsPerUser: 1,
            },
            Currency: 'USD',
            Cycle: CYCLE.MONTHLY,
            PeriodEnd: 1735689600,
            SubscriptionMode: 0,
            BaseRenewAmount: 9999,
            RenewCycle: CYCLE.MONTHLY,
            requestData: {
                Plans: { [PLANS.MAIL]: 1 },
                Currency: 'USD',
                Cycle: CYCLE.MONTHLY,
            },
        };

        const config: CouponConfigProps = {
            checkResult,
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap: {},
        };

        expect(matchCouponConfig(config, testCouponConfigs)).toBeUndefined();
    });
});
