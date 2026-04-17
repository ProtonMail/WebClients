import type { MethodsHook } from '@proton/components/payments/react-extensions';
import { PAYMENT_METHOD_TYPES, PLANS, type PlanIDs } from '@proton/payments';
import type { UserModel } from '@proton/shared/lib/interfaces';

import type { CouponConfigRendered } from '../../coupon-config/useCouponConfig';
import { getDisableCurrencySelector } from './getDisableCurrencySelector';

const makePaymentMethods = (type?: PAYMENT_METHOD_TYPES): MethodsHook =>
    ({
        selectedMethod: type ? { type } : undefined,
    }) as MethodsHook;

const makeUser = (credit: number): UserModel => ({ Credit: credit }) as UserModel;

const nonLifetimePlanIDs: PlanIDs = { [PLANS.MAIL]: 1 };
const lifetimePlanIDs: PlanIDs = { [PLANS.PASS_LIFETIME]: 1 };

const baseArgs = {
    paymentMethods: makePaymentMethods(),
    user: makeUser(0),
    planIDs: nonLifetimePlanIDs,
    couponConfig: undefined as CouponConfigRendered | undefined,
    loading: undefined as boolean | undefined,
};

describe('getDisableCurrencySelector', () => {
    it('returns falsy when none of the disable conditions are met', () => {
        expect(
            getDisableCurrencySelector(
                baseArgs.paymentMethods,
                baseArgs.user,
                baseArgs.planIDs,
                baseArgs.couponConfig,
                baseArgs.loading
            )
        ).toBeFalsy();
    });

    describe('SEPA direct debit', () => {
        it('returns true when selected method is CHARGEBEE_SEPA_DIRECT_DEBIT', () => {
            expect(
                getDisableCurrencySelector(
                    makePaymentMethods(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT),
                    baseArgs.user,
                    baseArgs.planIDs,
                    baseArgs.couponConfig,
                    baseArgs.loading
                )
            ).toBe(true);
        });

        it('returns falsy when selected method is a different type', () => {
            expect(
                getDisableCurrencySelector(
                    makePaymentMethods(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD),
                    baseArgs.user,
                    baseArgs.planIDs,
                    baseArgs.couponConfig,
                    baseArgs.loading
                )
            ).toBeFalsy();
        });

        it('returns falsy when no method is selected', () => {
            expect(
                getDisableCurrencySelector(
                    makePaymentMethods(),
                    baseArgs.user,
                    baseArgs.planIDs,
                    baseArgs.couponConfig,
                    baseArgs.loading
                )
            ).toBeFalsy();
        });
    });

    describe('lifetime plan with credits', () => {
        it('returns true when user has credits and a lifetime plan is selected', () => {
            expect(
                getDisableCurrencySelector(
                    baseArgs.paymentMethods,
                    makeUser(100),
                    lifetimePlanIDs,
                    baseArgs.couponConfig,
                    baseArgs.loading
                )
            ).toBe(true);
        });

        it('returns falsy when user has credits but plan is not lifetime', () => {
            expect(
                getDisableCurrencySelector(
                    baseArgs.paymentMethods,
                    makeUser(100),
                    nonLifetimePlanIDs,
                    baseArgs.couponConfig,
                    baseArgs.loading
                )
            ).toBeFalsy();
        });

        it('returns falsy when lifetime plan is selected but user has no credits', () => {
            expect(
                getDisableCurrencySelector(
                    baseArgs.paymentMethods,
                    makeUser(0),
                    lifetimePlanIDs,
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
                    baseArgs.paymentMethods,
                    baseArgs.user,
                    baseArgs.planIDs,
                    { disableCurrencySelector: true } as CouponConfigRendered,
                    baseArgs.loading
                )
            ).toBe(true);
        });

        it('returns falsy when couponConfig.disableCurrencySelector is false', () => {
            expect(
                getDisableCurrencySelector(
                    baseArgs.paymentMethods,
                    baseArgs.user,
                    baseArgs.planIDs,
                    { disableCurrencySelector: false } as CouponConfigRendered,
                    baseArgs.loading
                )
            ).toBeFalsy();
        });

        it('returns falsy when couponConfig is undefined', () => {
            expect(
                getDisableCurrencySelector(
                    baseArgs.paymentMethods,
                    baseArgs.user,
                    baseArgs.planIDs,
                    undefined,
                    baseArgs.loading
                )
            ).toBeFalsy();
        });
    });

    describe('loading', () => {
        it('returns true when loading is true', () => {
            expect(
                getDisableCurrencySelector(
                    baseArgs.paymentMethods,
                    baseArgs.user,
                    baseArgs.planIDs,
                    baseArgs.couponConfig,
                    true
                )
            ).toBe(true);
        });

        it('returns falsy when loading is false', () => {
            expect(
                getDisableCurrencySelector(
                    baseArgs.paymentMethods,
                    baseArgs.user,
                    baseArgs.planIDs,
                    baseArgs.couponConfig,
                    false
                )
            ).toBeFalsy();
        });

        it('returns falsy when loading is undefined', () => {
            expect(
                getDisableCurrencySelector(
                    baseArgs.paymentMethods,
                    baseArgs.user,
                    baseArgs.planIDs,
                    baseArgs.couponConfig,
                    undefined
                )
            ).toBeFalsy();
        });
    });
});
