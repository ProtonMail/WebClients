import { subDays } from 'date-fns';

import { CYCLE, PLANS, PLAN_TYPES } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import { SubscriptionPlatform } from '@proton/payments/core/subscription/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { configuration } from './configuration';
import { getIsEligible } from './eligibility';

const IN_WINDOW_12M = 330;
const IN_WINDOW_24M = 250;

const appConfig = (APP_NAME: string) => {
    return { APP_NAME } as unknown as ProtonConfig;
};

const paidUser = {
    canPay: true,
    isDelinquent: false,
    isPaid: true,
    isFree: false,
} as unknown as UserModel;

interface SubscriptionOptions {
    plan?: PLANS;
    cycle?: CYCLE;
    daysSincePeriodStart?: number;
    isTrial?: boolean;
    external?: SubscriptionPlatform | false;
    upcoming?: Partial<Subscription> | null;
    renew?: number;
}

const buildSubscription = ({
    plan = PLANS.BUNDLE,
    cycle = CYCLE.YEARLY,
    daysSincePeriodStart = IN_WINDOW_12M,
    isTrial = false,
    external = false,
    upcoming = null,
    renew = 1,
}: SubscriptionOptions = {}): Subscription => {
    return {
        ID: 'subscription-id',
        IsTrial: isTrial,
        External: external,
        Cycle: cycle,
        CouponCode: null,
        Plans: [{ Type: PLAN_TYPES.PLAN, Name: plan }],
        UpcomingSubscription: upcoming,
        PeriodStart: Math.floor(subDays(new Date(), daysSincePeriodStart).getTime() / 1000),
        Renew: renew,
    } as unknown as Subscription;
};

const baseProps = {
    user: paidUser,
    protonConfig: appConfig('proton-mail'),
    offerConfig: configuration,
    preferredCurrency: 'EUR' as Currency,
    pathname: '/',
};

describe('unlimitedToDuoDiscounted eligibility', () => {
    it('should be eligible for a yearly Unlimited subscriber inside the window', () => {
        expect(getIsEligible({ ...baseProps, subscription: buildSubscription() })).toBe(true);
    });

    it('should be eligible for a two-yearly Unlimited subscriber inside the window', () => {
        const subscription = buildSubscription({
            cycle: CYCLE.TWO_YEARS,
            daysSincePeriodStart: IN_WINDOW_24M,
        });

        expect(getIsEligible({ ...baseProps, subscription })).toBe(true);
    });

    it('should be eligible for a subscriber who has cancelled auto-renew', () => {
        expect(getIsEligible({ ...baseProps, subscription: buildSubscription({ renew: 0 }) })).toBe(true);
    });

    it('should not be eligible outside the window', () => {
        expect(getIsEligible({ ...baseProps, subscription: buildSubscription({ daysSincePeriodStart: 100 }) })).toBe(
            false
        );
    });

    it('should not be eligible on a monthly cycle', () => {
        expect(getIsEligible({ ...baseProps, subscription: buildSubscription({ cycle: CYCLE.MONTHLY }) })).toBe(false);
    });

    it('should not be eligible on another plan', () => {
        expect(getIsEligible({ ...baseProps, subscription: buildSubscription({ plan: PLANS.MAIL }) })).toBe(false);
    });

    it('should not be eligible without a subscription', () => {
        expect(getIsEligible({ ...baseProps, subscription: undefined })).toBe(false);
    });

    it('should not be eligible when the subscription is managed externally', () => {
        const subscription = buildSubscription({ external: SubscriptionPlatform.Android });

        expect(getIsEligible({ ...baseProps, subscription })).toBe(false);
    });

    it('should not be eligible with an upcoming subscription', () => {
        const subscription = buildSubscription({ upcoming: { ID: 'upcoming' } });

        expect(getIsEligible({ ...baseProps, subscription })).toBe(false);
    });

    it('should not be eligible when the user cannot pay', () => {
        const user = { ...paidUser, canPay: false } as UserModel;

        expect(getIsEligible({ ...baseProps, user, subscription: buildSubscription() })).toBe(false);
    });

    it('should not be eligible when the user is delinquent', () => {
        const user = { ...paidUser, isDelinquent: true } as UserModel;

        expect(getIsEligible({ ...baseProps, user, subscription: buildSubscription() })).toBe(false);
    });

    it('should not be eligible for a Pass Lifetime user', () => {
        const user = { ...paidUser, Flags: { 'pass-lifetime': true } } as unknown as UserModel;

        expect(getIsEligible({ ...baseProps, user, subscription: buildSubscription() })).toBe(false);
    });

    it('should be eligible in proton-mail', () => {
        const protonConfig = appConfig('proton-mail');

        expect(getIsEligible({ ...baseProps, protonConfig, subscription: buildSubscription() })).toBe(true);
    });

    it.each(['proton-calendar', 'proton-drive'])('should not be eligible in %s', (appName) => {
        const protonConfig = appConfig(appName);

        expect(getIsEligible({ ...baseProps, protonConfig, subscription: buildSubscription() })).toBe(false);
    });

    it('should be eligible in the account app when reached from an eligible product', () => {
        const protonConfig = appConfig('proton-account');

        expect(
            getIsEligible({
                ...baseProps,
                protonConfig,
                pathname: '/mail/dashboard',
                subscription: buildSubscription(),
            })
        ).toBe(true);
    });

    it('should not be eligible in the account app when reached from an ineligible product', () => {
        const protonConfig = appConfig('proton-account');

        expect(
            getIsEligible({
                ...baseProps,
                protonConfig,
                pathname: '/drive/dashboard',
                subscription: buildSubscription(),
            })
        ).toBe(false);
    });

    it('should not be eligible in an app outside the offer scope', () => {
        const protonConfig = appConfig('proton-docs');

        expect(getIsEligible({ ...baseProps, protonConfig, subscription: buildSubscription() })).toBe(false);
    });
});
