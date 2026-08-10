import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { SubscriptionPlatform } from '@proton/payments/core/subscription/constants';

import {
    accountAppConfig,
    buildSubscription,
    calendarAppConfig,
    driveAppConfig,
    eligibleCurrency,
    freeUser,
    ineligibleCurrency,
    mailAppConfig,
    paidUser,
    setPathname,
} from '../q3Sale2026.test.helpers';
import { configuration } from './configuration';
import { getIsEligible } from './eligibility';

const baseProps = {
    user: freeUser,
    protonConfig: mailAppConfig,
    offerConfig: configuration,
    preferredCurrency: eligibleCurrency,
};

describe('q3Sale2026FreeToUnlimited eligibility', () => {
    beforeEach(() => {
        setPathname('/');
    });

    describe('audience', () => {
        it('should be eligible for a free user with no subscription', () => {
            expect(getIsEligible({ ...baseProps })).toBe(true);
        });

        it('should not be eligible for a paid user', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    user: paidUser,
                    subscription: buildSubscription({ plan: PLANS.MAIL }),
                })
            ).toBe(false);
        });
    });

    describe('app scope', () => {
        it('should be eligible in the mail and calendar apps', () => {
            expect(getIsEligible({ ...baseProps, protonConfig: mailAppConfig })).toBe(true);
            expect(getIsEligible({ ...baseProps, protonConfig: calendarAppConfig })).toBe(true);
        });

        it('should be eligible in the account app under the mail and calendar dashboards', () => {
            setPathname('/mail/dashboard');
            expect(getIsEligible({ ...baseProps, protonConfig: accountAppConfig })).toBe(true);

            setPathname('/calendar/dashboard');
            expect(getIsEligible({ ...baseProps, protonConfig: accountAppConfig })).toBe(true);
        });

        it('should not be eligible in the drive app', () => {
            expect(getIsEligible({ ...baseProps, protonConfig: driveAppConfig })).toBe(false);
        });

        it('should not be eligible in the account app under the drive dashboard', () => {
            setPathname('/drive/dashboard');
            expect(getIsEligible({ ...baseProps, protonConfig: accountAppConfig })).toBe(false);
        });
    });

    describe('common exclusions', () => {
        it('should not be eligible when delinquent', () => {
            expect(getIsEligible({ ...baseProps, user: { ...freeUser, isDelinquent: true } })).toBe(false);
        });

        it('should not be eligible when the user cannot pay', () => {
            expect(getIsEligible({ ...baseProps, user: { ...freeUser, canPay: false } })).toBe(false);
        });

        it('should not be eligible with an ineligible currency', () => {
            expect(getIsEligible({ ...baseProps, preferredCurrency: ineligibleCurrency })).toBe(false);
        });

        it('should not be eligible while trialing', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    subscription: buildSubscription({ plan: PLANS.MAIL, isTrial: true }),
                })
            ).toBe(false);
        });

        it('should not be eligible for visionary users', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    subscription: buildSubscription({ plan: PLANS.VISIONARY }),
                })
            ).toBe(false);
        });
    });

    describe('already redeemed the Q3 sale', () => {
        it.each([
            COUPON_CODES.SEP26BUNDLESALE,
            COUPON_CODES.SEP26BUNDLEDEAL,
            COUPON_CODES.SEP26BUNDLESALECS,
            COUPON_CODES.SEP26BUNDLEDEALCS,
        ])('should not be eligible when the subscription carries %s', (couponCode) => {
            expect(
                getIsEligible({
                    ...baseProps,
                    subscription: buildSubscription({ plan: PLANS.MAIL, couponCode }),
                })
            ).toBe(false);
        });

        it('should not be eligible when the upcoming subscription carries the coupon', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    subscription: buildSubscription({
                        plan: PLANS.MAIL,
                        upcoming: buildSubscription({
                            plan: PLANS.MAIL,
                            couponCode: COUPON_CODES.SEP26BUNDLESALE,
                        }),
                    }),
                })
            ).toBe(false);
        });

        it('should still be eligible with an unrelated coupon', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    subscription: buildSubscription({
                        plan: PLANS.MAIL,
                        couponCode: COUPON_CODES.JUNE26BUNDLESALE,
                    }),
                })
            ).toBe(true);
        });
    });

    describe('external subscriptions', () => {
        // Free users have no subscription to be managed externally, so this offer deliberately
        // does not exclude mobile subscribers — matching the spec.
        it.each([SubscriptionPlatform.Android, SubscriptionPlatform.iOS])(
            'should still evaluate an externally managed %s subscription on plan checks alone',
            (external) => {
                expect(
                    getIsEligible({
                        ...baseProps,
                        subscription: buildSubscription({ plan: PLANS.MAIL, external, cycle: CYCLE.MONTHLY }),
                    })
                ).toBe(true);
            }
        );
    });
});
