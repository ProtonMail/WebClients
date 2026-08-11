import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { SubscriptionPlatform } from '@proton/payments/core/subscription/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';

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

describe('q3Sale2026PlusToUnlimited eligibility', () => {
    describe('eligible plans', () => {
        // Any paid single-product user can upgrade to the bundle: Mail Plus, Drive Plus (drive2022 and
        // drive1tb2025), VPN (vpn2022 and vpn2024), or Pass Plus.
        it.each([PLANS.MAIL, PLANS.DRIVE, PLANS.DRIVE_1TB, PLANS.VPN, PLANS.VPN2024, PLANS.PASS])(
            'should be eligible on %s',
            (plan) => {
                expect(getIsEligible({ ...baseProps, subscription: buildSubscription({ plan }) })).toBe(true);
            }
        );

        it.each([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS])('should be eligible on cycle %s', (cycle) => {
            expect(getIsEligible({ ...baseProps, subscription: buildSubscription({ plan: PLANS.MAIL, cycle }) })).toBe(
                true
            );
        });

        // Pass lifetime and Pass-via-SimpleLogin users are deliberately out of scope: they have no
        // Plus subscription, so the spec's "Pass Plus 1/12/24M" audience does not cover them.
        it.each([{ 'pass-lifetime': true }, { 'pass-from-sl': true }])(
            'should not be eligible for a user with flags %o and no paid plan',
            (Flags) => {
                const user = { ...paidUser, Flags } as unknown as UserModel;

                expect(
                    getIsEligible({
                        ...baseProps,
                        user,
                        subscription: buildSubscription({ plan: PLANS.FREE }),
                    })
                ).toBe(false);
            }
        );
    });

    describe('plans already at or above Unlimited', () => {
        it.each([PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY])('should not be eligible on %s', (plan) => {
            expect(getIsEligible({ ...baseProps, subscription: buildSubscription({ plan }) })).toBe(false);
        });
    });

    describe('audience', () => {
        it('should not be eligible for a free user', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    user: freeUser,
                    subscription: buildSubscription({ plan: PLANS.MAIL }),
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
                    subscription: buildSubscription({ plan: PLANS.MAIL }),
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
                        subscription: buildSubscription({ plan: PLANS.MAIL }),
                    })
                ).toBe(true);
            }
        );

        it('should not be eligible in apps outside the campaign', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    protonConfig: docsAppConfig,
                    subscription: buildSubscription({ plan: PLANS.MAIL }),
                })
            ).toBe(false);
        });

        it('should not be eligible in the account app with no product in the path', () => {
            setPathname('/');

            expect(
                getIsEligible({
                    ...baseProps,
                    protonConfig: accountAppConfig,
                    subscription: buildSubscription({ plan: PLANS.MAIL }),
                })
            ).toBe(false);
        });
    });

    describe('common exclusions', () => {
        const subscription = buildSubscription({ plan: PLANS.MAIL });

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
                    subscription: buildSubscription({ plan: PLANS.MAIL, isTrial: true }),
                })
            ).toBe(false);
        });

        it.each([SubscriptionPlatform.Android, SubscriptionPlatform.iOS])(
            'should not be eligible for externally managed %s subscriptions',
            (external) => {
                expect(
                    getIsEligible({
                        ...baseProps,
                        subscription: buildSubscription({ plan: PLANS.MAIL, external }),
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
    });
});
