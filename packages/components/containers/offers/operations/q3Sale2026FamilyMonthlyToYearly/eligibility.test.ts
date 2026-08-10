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
    user: paidUser,
    protonConfig: mailAppConfig,
    offerConfig: configuration,
    preferredCurrency: eligibleCurrency,
};

describe('q3Sale2026FamilyMonthlyToYearly eligibility', () => {
    beforeEach(() => {
        setPathname('/');
    });

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

        // Duo users are covered by q3Sale2026DuoToFamily, not this operation.
        it('should not be eligible for monthly Duo users', () => {
            expect(
                getIsEligible({
                    ...baseProps,
                    subscription: buildSubscription({ plan: PLANS.DUO, cycle: CYCLE.MONTHLY }),
                })
            ).toBe(false);
        });

        it.each([PLANS.MAIL, PLANS.BUNDLE, PLANS.DRIVE, PLANS.PASS, PLANS.VPN2024])(
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
        const subscription = buildSubscription({ plan: PLANS.FAMILY, cycle: CYCLE.MONTHLY });

        it('should be eligible in the mail and calendar apps', () => {
            expect(getIsEligible({ ...baseProps, protonConfig: mailAppConfig, subscription })).toBe(true);
            expect(getIsEligible({ ...baseProps, protonConfig: calendarAppConfig, subscription })).toBe(true);
        });

        it('should be eligible in the account app under the mail and calendar dashboards', () => {
            setPathname('/mail/dashboard');
            expect(getIsEligible({ ...baseProps, protonConfig: accountAppConfig, subscription })).toBe(true);

            setPathname('/calendar/dashboard');
            expect(getIsEligible({ ...baseProps, protonConfig: accountAppConfig, subscription })).toBe(true);
        });

        it('should not be eligible in the drive app', () => {
            expect(getIsEligible({ ...baseProps, protonConfig: driveAppConfig, subscription })).toBe(false);
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
