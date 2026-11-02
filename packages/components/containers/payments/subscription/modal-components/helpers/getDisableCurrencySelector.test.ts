import { PLANS } from '@proton/payments/core/constants';
import type { CouponConfigMetadata } from '@proton/payments/core/coupon-config/interface';
import type { PlanIDs } from '@proton/payments/core/interface';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { getDisableCurrencySelector } from './getDisableCurrencySelector';

const makeUser = (credit: number): UserModel => ({ Credit: credit }) as UserModel;

const nonLifetimePlanIDs: PlanIDs = { [PLANS.MAIL]: 1 };
const lifetimePlanIDs: PlanIDs = { [PLANS.PASS_LIFETIME]: 1 };

const baseArgs = {
    user: makeUser(0),
    planIDs: nonLifetimePlanIDs,
    couponConfig: undefined as CouponConfigMetadata | undefined,
    loading: undefined as boolean | undefined,
};

describe('getDisableCurrencySelector', () => {
    it('returns falsy when none of the disable conditions are met', () => {
        expect(
            getDisableCurrencySelector(baseArgs.user, baseArgs.planIDs, baseArgs.couponConfig, baseArgs.loading)
        ).toBeFalsy();
    });

    describe('lifetime plan with credits', () => {
        it('returns true when user has credits and a lifetime plan is selected', () => {
            expect(
                getDisableCurrencySelector(makeUser(100), lifetimePlanIDs, baseArgs.couponConfig, baseArgs.loading)
            ).toBe(true);
        });

        it('returns falsy when user has credits but plan is not lifetime', () => {
            expect(
                getDisableCurrencySelector(makeUser(100), nonLifetimePlanIDs, baseArgs.couponConfig, baseArgs.loading)
            ).toBeFalsy();
        });

        it('returns falsy when lifetime plan is selected but user has no credits', () => {
            expect(
                getDisableCurrencySelector(makeUser(0), lifetimePlanIDs, baseArgs.couponConfig, baseArgs.loading)
            ).toBeFalsy();
        });
    });

    describe('plan-locked currency', () => {
        it('returns true when Pass basic is selected', () => {
            expect(
                getDisableCurrencySelector(
                    baseArgs.user,
                    { [PLANS.PASS_BASIC]: 1 },
                    baseArgs.couponConfig,
                    baseArgs.loading
                )
            ).toBe(true);
        });

        it('returns falsy when Pass basic quantity is 0', () => {
            expect(
                getDisableCurrencySelector(
                    baseArgs.user,
                    { [PLANS.PASS_BASIC]: 0 },
                    baseArgs.couponConfig,
                    baseArgs.loading
                )
            ).toBeFalsy();
        });
    });

    describe('coupon config', () => {
        it('returns true when couponConfig.disableCurrencySelector is true', () => {
            expect(
                getDisableCurrencySelector(
                    baseArgs.user,
                    baseArgs.planIDs,
                    { disableCurrencySelector: true } as CouponConfigMetadata,
                    baseArgs.loading
                )
            ).toBe(true);
        });

        it('returns falsy when couponConfig.disableCurrencySelector is false', () => {
            expect(
                getDisableCurrencySelector(
                    baseArgs.user,
                    baseArgs.planIDs,
                    { disableCurrencySelector: false } as CouponConfigMetadata,
                    baseArgs.loading
                )
            ).toBeFalsy();
        });

        it('returns falsy when couponConfig is undefined', () => {
            expect(
                getDisableCurrencySelector(baseArgs.user, baseArgs.planIDs, undefined, baseArgs.loading)
            ).toBeFalsy();
        });
    });

    describe('loading', () => {
        it('returns true when loading is true', () => {
            expect(getDisableCurrencySelector(baseArgs.user, baseArgs.planIDs, baseArgs.couponConfig, true)).toBe(true);
        });

        it('returns falsy when loading is false', () => {
            expect(
                getDisableCurrencySelector(baseArgs.user, baseArgs.planIDs, baseArgs.couponConfig, false)
            ).toBeFalsy();
        });

        it('returns falsy when loading is undefined', () => {
            expect(
                getDisableCurrencySelector(baseArgs.user, baseArgs.planIDs, baseArgs.couponConfig, undefined)
            ).toBeFalsy();
        });
    });
});
