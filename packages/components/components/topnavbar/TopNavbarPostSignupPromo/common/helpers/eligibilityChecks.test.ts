import { addDays } from 'date-fns';

import {
    ADDON_NAMES,
    CYCLE,
    FREE_SUBSCRIPTION,
    PLANS,
    type Subscription,
    SubscriptionPlatform,
} from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { buildSubscription } from '@proton/testing/builders';

import {
    checkAppIsValid,
    checkCycleIsValid,
    checkPlanIsValid,
    checkTimeSubscribedIsValid,
    checksAllPass,
    hasNoScheduledSubscription,
    hasSubscription,
    isWebSubscription,
    noPassLifetime,
    userCanPay,
    userNotDelinquent,
} from './eligibilityChecks';

describe('eligibilityChecker helpers', () => {
    const baseUser: UserModel = {
        isDelinquent: false,
        canPay: true,
        Flags: { 'pass-lifetime': false },
    } as UserModel;

    const delinquentUser: UserModel = {
        ...baseUser,
        isDelinquent: true,
    };

    const cannotPayUser: UserModel = {
        ...baseUser,
        canPay: false,
    };

    const passLifetimeUser: UserModel = {
        ...baseUser,
        Flags: { ...baseUser.Flags, 'pass-lifetime': true },
    };

    const validSubscription = buildSubscription(
        {
            planName: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
            currency: 'USD',
        },
        {
            PeriodStart: Math.floor(Date.now() / 1000),
        }
    );

    const subscriptionWithUpcoming = {
        ...validSubscription,
        UpcomingSubscription: buildSubscription({
            planName: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
            currency: 'USD',
        }),
    };

    const externalAndroid: Subscription = {
        ...validSubscription,
        External: SubscriptionPlatform.Android,
    };

    const externalIOS: Subscription = {
        ...validSubscription,
        External: SubscriptionPlatform.iOS,
    };

    const validProtonConfig: ProtonConfig = {
        API_URL: '',
        APP_NAME: APPS.PROTONMAIL,
        APP_VERSION: '',
        BRANCH: '',
        CLIENT_SECRET: '',
        CLIENT_TYPE: undefined as any,
        COMMIT: '',
        DATE_VERSION: '',
        LOCALES: {},
        SENTRY_DSN: '',
        SSO_URL: '',
        VERSION_PATH: '',
        LOGICAL_SCSS: true,
    };

    describe('checksAllPass', () => {
        it('returns true if all checks are true', () => {
            expect(checksAllPass(true, true, true)).toBe(true);
        });
        it('returns false if any check is false', () => {
            expect(checksAllPass(true, false, true)).toBe(false);
        });
    });

    describe('hasSubscription', () => {
        it('returns true if subscription is defined', () => {
            expect(hasSubscription(validSubscription)).toBe(true);
        });
        it('returns false if subscription is undefined', () => {
            expect(hasSubscription(undefined)).toBe(false);
        });
        it('returns false if FREE_SUBSCRIPTION is provided (free subscriptions are not considered)', () => {
            expect(hasSubscription(FREE_SUBSCRIPTION)).toBe(false);
        });
    });

    describe('isWebSubscription', () => {
        it('returns true if subscription is not managed externally', () => {
            expect(isWebSubscription(validSubscription)).toBe(true);
        });
        it('returns false if external is Android', () => {
            expect(isWebSubscription(externalAndroid)).toBe(false);
        });
        it('returns false if external is iOS', () => {
            expect(isWebSubscription(externalIOS)).toBe(false);
        });
        it('returns false if subscription is undefined', () => {
            expect(isWebSubscription(undefined)).toBe(false);
        });
        it('returns true if FREE_SUBSCRIPTION is provided (not managed externally)', () => {
            expect(isWebSubscription(FREE_SUBSCRIPTION)).toBe(true);
        });
    });

    describe('hasNoScheduledSubscription', () => {
        it('returns true if there is no UpcomingSubscription', () => {
            expect(hasNoScheduledSubscription(validSubscription)).toBe(true);
        });
        it('returns false if there is an UpcomingSubscription', () => {
            expect(hasNoScheduledSubscription(subscriptionWithUpcoming)).toBe(false);
        });
        it('returns true if subscription is undefined', () => {
            expect(hasNoScheduledSubscription(undefined)).toBe(true);
        });
        it('returns true if FREE_SUBSCRIPTION is provided (UpcomingSubscription is undefined)', () => {
            expect(hasNoScheduledSubscription(FREE_SUBSCRIPTION)).toBe(true);
        });
    });

    describe('userCanPay', () => {
        it('returns true if user.canPay is true', () => {
            expect(userCanPay(baseUser)).toBe(true);
        });
        it('returns false if user.canPay is false', () => {
            expect(userCanPay(cannotPayUser)).toBe(false);
        });
    });

    describe('userNotDelinquent', () => {
        it('returns true if user.isDelinquent is false', () => {
            expect(userNotDelinquent(baseUser)).toBe(true);
        });
        it('returns false if user.isDelinquent is true', () => {
            expect(userNotDelinquent(delinquentUser)).toBe(false);
        });
    });

    describe('noPassLifetime', () => {
        it('returns true if user does not have pass lifetime', () => {
            expect(noPassLifetime(baseUser)).toBe(true);
        });
        it('returns false if user has pass lifetime', () => {
            expect(noPassLifetime(passLifetimeUser)).toBe(false);
        });
    });

    describe('checkAppIsValid', () => {
        it('returns true if currentApp is among allowedApps', () => {
            expect(checkAppIsValid([APPS.PROTONMAIL, APPS.PROTONDRIVE], validProtonConfig, APPS.PROTONMAIL)).toBe(true);
        });
        it('returns false if currentApp is not allowed and parentApp is not allowed', () => {
            expect(
                checkAppIsValid(
                    [APPS.PROTONDRIVE],
                    { ...validProtonConfig, APP_NAME: APPS.PROTONMAIL },
                    APPS.PROTONMAIL
                )
            ).toBe(false);
        });
        it('returns true if currentApp is PROTONACCOUNT but parentApp is allowed', () => {
            expect(
                checkAppIsValid(
                    [APPS.PROTONMAIL],
                    { ...validProtonConfig, APP_NAME: APPS.PROTONACCOUNT },
                    APPS.PROTONMAIL
                )
            ).toBe(true);
        });
    });

    describe('checkCycleIsValid', () => {
        function makeSub(cycle: number) {
            return { ...validSubscription, Cycle: cycle };
        }

        it('returns true if yearly and subscription has yearly', () => {
            expect(checkCycleIsValid([CYCLE.YEARLY], makeSub(CYCLE.YEARLY))).toBe(true);
        });
        it('returns true if twoYears and subscription has two years', () => {
            expect(checkCycleIsValid([CYCLE.TWO_YEARS], makeSub(CYCLE.TWO_YEARS))).toBe(true);
        });
        it('returns true if monthly and subscription has monthly', () => {
            expect(checkCycleIsValid([CYCLE.MONTHLY], makeSub(CYCLE.MONTHLY))).toBe(true);
        });
        it('returns false if option cycle not matched', () => {
            expect(checkCycleIsValid([CYCLE.YEARLY], makeSub(CYCLE.MONTHLY))).toBe(false);
        });
        it('returns false if subscription is undefined', () => {
            expect(checkCycleIsValid([CYCLE.YEARLY], undefined)).toBe(false);
        });
        it('returns false if FREE_SUBSCRIPTION is provided', () => {
            expect(checkCycleIsValid([CYCLE.YEARLY], FREE_SUBSCRIPTION)).toBe(false);
        });
    });

    describe('checkPlanIsValid', () => {
        it('returns true if mail option and mail plan', () => {
            expect(checkPlanIsValid([PLANS.MAIL], buildSubscription(PLANS.MAIL))).toBe(true);
        });
        it('returns true if drive option and drive plan', () => {
            expect(checkPlanIsValid([PLANS.DRIVE], buildSubscription(PLANS.DRIVE))).toBe(true);
        });
        it('returns false if subscription is undefined', () => {
            expect(checkPlanIsValid([PLANS.MAIL], undefined)).toBe(false);
        });
        it('returns false if subscription has an addon plan instead of a base plan', () => {
            const subWithAddonPlan = buildSubscription({
                planIDs: {
                    [PLANS.DRIVE_PRO]: 1,
                    [ADDON_NAMES.MEMBER_DRIVE_PRO]: 1,
                },
                cycle: CYCLE.YEARLY,
                currency: 'USD',
            });

            expect(checkPlanIsValid([PLANS.MAIL], subWithAddonPlan)).toBe(false);
        });
        it('returns false if FREE_SUBSCRIPTION is provided', () => {
            expect(checkPlanIsValid([PLANS.MAIL], FREE_SUBSCRIPTION)).toBe(false);
        });
    });

    describe('checkTimeSubscribedIsValid', () => {
        const setSubscriptionPeriodStart = (daysAgo: number) => ({
            ...validSubscription,
            PeriodStart: addDays(new Date(), -daysAgo).getTime() / 1000,
        });

        it('returns true if subscribed for the minimum number of days', () => {
            const sub = setSubscriptionPeriodStart(10);
            expect(checkTimeSubscribedIsValid(10, sub)).toBe(true);
        });

        it('returns true if subscribed for more than the minimum number of days', () => {
            const sub = setSubscriptionPeriodStart(15);
            expect(checkTimeSubscribedIsValid(10, sub)).toBe(true);
        });

        it('returns false if subscribed for less than the minimum number of days', () => {
            const sub = setSubscriptionPeriodStart(5);
            expect(checkTimeSubscribedIsValid(10, sub)).toBe(false);
        });

        it('returns false if subscription is undefined', () => {
            expect(checkTimeSubscribedIsValid(10, undefined)).toBe(false);
        });

        it('returns true when PeriodStart is today and minDays is 0', () => {
            const now = Math.floor(Date.now() / 1000);
            const sub = { ...validSubscription, PeriodStart: now };
            expect(checkTimeSubscribedIsValid(0, sub)).toBe(true);
        });

        it('returns false when PeriodStart is today and minDays is positive', () => {
            const now = Math.floor(Date.now() / 1000);
            const sub = { ...validSubscription, PeriodStart: now };
            expect(checkTimeSubscribedIsValid(1, sub)).toBe(false);
        });

        it('returns false if FREE_SUBSCRIPTION is provided', () => {
            expect(checkTimeSubscribedIsValid(10, FREE_SUBSCRIPTION)).toBe(false);
        });
    });
});
