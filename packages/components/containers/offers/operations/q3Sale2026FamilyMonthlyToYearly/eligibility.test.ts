import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { SubscriptionPlatform } from '@proton/payments/core/subscription/constants';

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
    setPathname,
} from '../q3Sale2026.test.helpers';
import { configuration } from './configuration';
import { getIsEligible } from './eligibility';

const baseProps = {
    user: paidUser,
    protonConfig: mailAppConfig,
    offerConfig: configuration,
    preferredCurrency: eligibleCurrency,
};

describe('q3Sale2026FamilyMonthlyToYearly eligibility', () => {
    describe('audience', () => {
        it('should be eligible for monthly Family users', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    subscription: buildSubscription({ plan: PLANS.FAMILY, cycle: CYCLE.MONTHLY }),
                })
            ).toBe(true);
        });

        // Yearly and two-year Family users are already on the target plan and cycle.
        it.each([CYCLE.YEARLY, CYCLE.TWO_YEARS])('should not be eligible for Family users on cycle %s', (cycle) => {
            expect(
                getIsEligible({ ...baseProps, subscription: buildSubscription({ plan: PLANS.FAMILY, cycle }) })
            ).toBe(false);
        });

        // Duo users are covered by q3Sale2026DuoToFamily, which has its own ref.
        it('should not be eligible for monthly Duo users', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    subscription: buildSubscription({ plan: PLANS.DUO, cycle: CYCLE.MONTHLY }),
                })
            ).toBe(false);
        });

        it.each([PLANS.MAIL, PLANS.DRIVE, PLANS.BUNDLE, PLANS.PASS, PLANS.VPN2024])(
            'should not be eligible on monthly %s',
            (plan) => {
                expect(
                    getIsEligible({
                        ...baseProps,
                        subscription: buildSubscription({ plan, cycle: CYCLE.MONTHLY }),
                    })
                ).toBe(false);
            }
        );

        it('should not be eligible for a free user', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    user: freeUser,
                    subscription: buildSubscription({ plan: PLANS.FAMILY, cycle: CYCLE.MONTHLY }),
                })
            ).toBe(false);
        });

        it('should not be eligible without a subscription', () => {
            expect(getIsEligible({ ...baseProps })).toBe(false);
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
                    subscription: buildSubscription({ plan: PLANS.FAMILY, cycle: CYCLE.MONTHLY }),
                })
            ).toBe(true);
        });

        it.each(['/mail/dashboard', '/calendar/dashboard', '/drive/dashboard'])(
            'should be eligible in the account app under %s',
            (pathname) => {
                setPathname(pathname);

                expect(
                    getIsEligible({
                        ...baseProps,
                        protonConfig: accountAppConfig,
                        subscription: buildSubscription({ plan: PLANS.FAMILY, cycle: CYCLE.MONTHLY }),
                    })
                ).toBe(true);
            }
        );

        it('should not be eligible in apps outside the campaign', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    protonConfig: docsAppConfig,
                    subscription: buildSubscription({ plan: PLANS.FAMILY, cycle: CYCLE.MONTHLY }),
                })
            ).toBe(false);
        });

        it('should not be eligible in the account app with no product in the path', () => {
            setPathname('/');

            expect(
                getIsEligible({
                    ...baseProps,
                    protonConfig: accountAppConfig,
                    subscription: buildSubscription({ plan: PLANS.FAMILY, cycle: CYCLE.MONTHLY }),
                })
            ).toBe(false);
        });
    });

    describe('common exclusions', () => {
        const subscription = buildSubscription({ plan: PLANS.FAMILY, cycle: CYCLE.MONTHLY });

        it('should not be eligible when delinquent', () => {
            expect(getIsEligible({ ...baseProps, user: { ...paidUser, isDelinquent: true }, subscription })).toBe(
                false
            );
        });

        it('should not be eligible when the user cannot pay', () => {
            expect(getIsEligible({ ...baseProps, user: { ...paidUser, canPay: false }, subscription })).toBe(false);
        });

        it('should not be eligible with an ineligible currency', () => {
            expect(getIsEligible({ ...baseProps, subscription, preferredCurrency: ineligibleCurrency })).toBe(false);
        });

        it('should not be eligible while trialing', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    subscription: buildSubscription({
                        plan: PLANS.FAMILY,
                        cycle: CYCLE.MONTHLY,
                        isTrial: true,
                    }),
                })
            ).toBe(false);
        });

        it.each([SubscriptionPlatform.Android, SubscriptionPlatform.iOS])(
            'should not be eligible for externally managed %s subscriptions',
            (external) => {
                expect(
                    getIsEligible({
                        ...baseProps,
                        subscription: buildSubscription({
                            plan: PLANS.FAMILY,
                            cycle: CYCLE.MONTHLY,
                            external,
                        }),
                    })
                ).toBe(false);
            }
        );
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
                    subscription: buildSubscription({ plan: PLANS.FAMILY, cycle: CYCLE.MONTHLY, couponCode }),
                })
            ).toBe(false);
        });
    });
});
