import { ADDON_NAMES, COUPON_CODES, CYCLE, type Coupon, PLANS } from '@proton/payments';
import { getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { getTestPlansMap } from '@proton/testing/data';

import { enrichCoupon } from './helpers';

describe('enrichCoupon', () => {
    it('should not enrich non-BF2025 coupons', () => {
        const checkResponse = getOptimisticCheckResult({
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            plansMap: getTestPlansMap('USD'),
            cycle: CYCLE.MONTHLY,
            currency: 'USD',
        });

        expect(checkResponse.Coupon).toBeNull();

        const checkResponseWithCoupon = getOptimisticCheckResult({
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            plansMap: getTestPlansMap('USD'),
            cycle: CYCLE.MONTHLY,
            currency: 'USD',
        });

        const someCoupon = {
            Code: 'SOME_PROMO',
            Description: 'Some promo',
            MaximumRedemptionsPerUser: 1,
        };
        checkResponseWithCoupon.Coupon = { ...someCoupon };

        enrichCoupon(checkResponseWithCoupon);

        expect(checkResponseWithCoupon.Coupon).toEqual(someCoupon);
    });

    let bf2025Coupon: Coupon;
    beforeEach(() => {
        bf2025Coupon = {
            Code: COUPON_CODES.BLACK_FRIDAY_2025,
            Description: 'Black Friday 2025',
            MaximumRedemptionsPerUser: 1,
        };
    });

    it('should enrich BF2025 coupon without addons', () => {
        const checkResponse = getOptimisticCheckResult({
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            plansMap: getTestPlansMap('USD'),
            cycle: CYCLE.MONTHLY,
            currency: 'USD',
        });
        checkResponse.Coupon = { ...bf2025Coupon } as Coupon;
        enrichCoupon(checkResponse);

        expect(checkResponse.Coupon).toEqual({
            ...bf2025Coupon,
            Targets: {
                [PLANS.MAIL]: 1,
            },
        });
    });

    it('should skip Lumo addons while enriching BF2025 coupon', () => {
        const checkResponse = getOptimisticCheckResult({
            planIDs: {
                [PLANS.MAIL]: 1,
                [ADDON_NAMES.LUMO_MAIL]: 1,
            },
            plansMap: getTestPlansMap('USD'),
            cycle: CYCLE.MONTHLY,
            currency: 'USD',
        });

        checkResponse.Coupon = { ...bf2025Coupon } as Coupon;
        enrichCoupon(checkResponse);

        expect(checkResponse.Coupon).toEqual({
            ...bf2025Coupon,
            Targets: {
                [PLANS.MAIL]: 1,
            },
        });
    });
});
