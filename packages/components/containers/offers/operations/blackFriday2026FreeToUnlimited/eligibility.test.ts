import { getUnixTime, subHours } from 'date-fns';

import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import {
    accountAppConfig,
    buildSubscription,
    calendarAppConfig,
    docsAppConfig,
    driveAppConfig,
    eligibleCurrency,
    freeUser,
    ineligibleCurrency,
    mailAppConfig,
    paidUser,
    passAppConfig,
    setPathname,
} from '../blackFriday2026.test.helpers';
import { BLACK_FRIDAY_2026_FREE_USER_MIN_ACCOUNT_AGE_HOURS } from '../blackFriday2026FreeUserEligibility';
import { configuration } from './configuration';
import { getIsEligible } from './eligibility';

const baseProps = {
    user: freeUser,
    protonConfig: mailAppConfig,
    offerConfig: configuration,
    preferredCurrency: eligibleCurrency,
};

describe('blackFriday2026FreeToUnlimited eligibility', () => {
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
        // The campaign runs in Mail, Calendar and Drive, plus the matching account dashboards. The
        // audience is defined by plan rather than by app, so the check is the union of all three: which
        // app the user was in is recorded in the tracking ref instead.
        it.each([mailAppConfig, calendarAppConfig, driveAppConfig])('should be eligible in %o', (protonConfig) => {
            expect(
                getIsEligible({
                    ...baseProps,
                    protonConfig,
                })
            ).toBe(true);
        });

        it.each(['/mail/dashboard', '/calendar/dashboard', '/drive/dashboard', '/pass/dashboard'])(
            'should be eligible in the account app under %s',
            (pathname) => {
                setPathname(pathname);

                expect(
                    getIsEligible({
                        ...baseProps,
                        protonConfig: accountAppConfig,
                    })
                ).toBe(true);
            }
        );

        it.each([docsAppConfig, passAppConfig])('should not be eligible in %o', (protonConfig) => {
            expect(
                getIsEligible({
                    ...baseProps,
                    protonConfig,
                })
            ).toBe(false);
        });

        it('should not be eligible in the account app with no product in the path', () => {
            setPathname('/');

            expect(
                getIsEligible({
                    ...baseProps,
                    protonConfig: accountAppConfig,
                })
            ).toBe(false);
        });
    });

    describe('common exclusions', () => {
        it('should not be eligible when delinquent', () => {
            expect(getIsEligible({ ...baseProps, user: { ...freeUser, isDelinquent: true } })).toBe(false);
        });

        it('should not be eligible when the user cannot pay', () => {
            expect(getIsEligible({ ...baseProps, user: { ...freeUser, canPay: false } })).toBe(false);
        });

        it('should not be eligible for an account younger than the minimum age', () => {
            const user = {
                ...freeUser,
                CreateTime: getUnixTime(subHours(new Date(), BLACK_FRIDAY_2026_FREE_USER_MIN_ACCOUNT_AGE_HOURS - 1)),
            };

            expect(getIsEligible({ ...baseProps, user })).toBe(false);
        });

        it('should be eligible once the account reaches the minimum age', () => {
            const user = {
                ...freeUser,
                CreateTime: getUnixTime(subHours(new Date(), BLACK_FRIDAY_2026_FREE_USER_MIN_ACCOUNT_AGE_HOURS)),
            };

            expect(getIsEligible({ ...baseProps, user })).toBe(true);
        });

        it('should not be eligible with a scheduled subscription modification', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    subscription: buildSubscription({
                        plan: PLANS.MAIL,
                        upcoming: { ...buildSubscription({ plan: PLANS.MAIL }), IsPrepaid: true },
                    }),
                })
            ).toBe(false);
        });

        it('should still be eligible when the upcoming subscription is an unpaid renewal', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    subscription: buildSubscription({
                        plan: PLANS.MAIL,
                        upcoming: { ...buildSubscription({ plan: PLANS.MAIL }), IsPrepaid: false },
                    }),
                })
            ).toBe(true);
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

    describe('already redeemed the Black Friday sale', () => {
        it.each([COUPON_CODES.BLACK_FRIDAY_2026_NEW, COUPON_CODES.BLACK_FRIDAY_2026_BUNDLE])(
            'should not be eligible when the subscription carries %s',
            (couponCode) => {
                expect(
                    getIsEligible({
                        ...baseProps,
                        subscription: buildSubscription({ plan: PLANS.MAIL, couponCode }),
                    })
                ).toBe(false);
            }
        );

        it('should not be eligible when the upcoming subscription carries the coupon', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    subscription: buildSubscription({
                        plan: PLANS.MAIL,
                        upcoming: buildSubscription({
                            plan: PLANS.MAIL,
                            couponCode: COUPON_CODES.BLACK_FRIDAY_2026_BUNDLE,
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
        // Free users have no subscription to be managed externally, so this offer deliberately does
        // not exclude mobile subscribers, matching the spec.
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
