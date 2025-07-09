import { subDays } from 'date-fns';

import { CYCLE, PLANS, type Subscription, SubscriptionPlatform } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { getIsEligible } from './eligibility';

const eligibleUser = {
    isDelinquent: false,
    canPay: true,
    Flags: { 'pass-lifetime': false },
} as UserModel;

const validMailConfig = {
    APP_NAME: APPS.PROTONMAIL,
} as ProtonConfig;

const validDriveConfig = {
    APP_NAME: APPS.PROTONDRIVE,
} as ProtonConfig;

const eligibleMailSubscription = {
    Cycle: CYCLE.YEARLY,
    Plans: [
        {
            Name: PLANS.MAIL,
        },
    ],
    External: SubscriptionPlatform.Default,
    CreateTime: subDays(new Date(), 180).getTime() / 1000,
} as Subscription;

const eligibleDriveSubscription = {
    Cycle: CYCLE.YEARLY,
    Plans: [
        {
            Name: PLANS.DRIVE,
        },
    ],
    External: SubscriptionPlatform.Default,
    CreateTime: subDays(new Date(), 180).getTime() / 1000,
} as Subscription;

describe('go unlimited offer eligibility', () => {
    it('should return true, the user met all mail requirements', () => {
        expect(
            getIsEligible({
                user: eligibleUser,
                subscription: eligibleMailSubscription,
                protonConfig: validMailConfig,
                parentApp: APPS.PROTONMAIL,
            })
        ).toBeTruthy();
    });

    it('should return true, the user met all drive requirements', () => {
        expect(
            getIsEligible({
                user: eligibleUser,
                subscription: eligibleDriveSubscription,
                protonConfig: validDriveConfig,
                parentApp: APPS.PROTONDRIVE,
            })
        ).toBeTruthy();
    });

    it('should return false, there is no subscription', () => {
        expect(
            getIsEligible({
                user: eligibleUser,
                subscription: undefined,
                protonConfig: validMailConfig,
                parentApp: APPS.PROTONMAIL,
            })
        ).toBeFalsy();
    });

    it('should return false, the subscription is managed externally (android)', () => {
        expect(
            getIsEligible({
                user: eligibleUser,
                subscription: { ...eligibleDriveSubscription, External: SubscriptionPlatform.Android },
                protonConfig: validMailConfig,
                parentApp: APPS.PROTONMAIL,
            })
        ).toBeFalsy();
    });

    it('should return false, the subscription is managed externally (iOS)', () => {
        expect(
            getIsEligible({
                user: eligibleUser,
                subscription: { ...eligibleMailSubscription, External: SubscriptionPlatform.iOS },
                protonConfig: validMailConfig,
                parentApp: APPS.PROTONMAIL,
            })
        ).toBeFalsy();
    });

    it('should return false, the subscription is not eligible cycle', () => {
        expect(
            getIsEligible({
                user: eligibleUser,
                subscription: { ...eligibleMailSubscription, Cycle: CYCLE.MONTHLY },
                protonConfig: validMailConfig,
                parentApp: APPS.PROTONMAIL,
            })
        ).toBeFalsy();
    });

    it('should return false, the subscription has a scheduled subscription', () => {
        expect(
            getIsEligible({
                user: eligibleUser,
                subscription: {
                    ...eligibleMailSubscription,
                    UpcomingSubscription: eligibleMailSubscription,
                },
                protonConfig: validMailConfig,
                parentApp: APPS.PROTONMAIL,
            })
        ).toBeFalsy();
    });

    it('should return false, the subscription is 2 days old', () => {
        expect(
            getIsEligible({
                user: eligibleUser,
                subscription: { ...eligibleMailSubscription, CreateTime: subDays(new Date(), 2).getTime() / 1000 },
                protonConfig: validMailConfig,
                parentApp: APPS.PROTONMAIL,
            })
        ).toBeFalsy();
    });

    it('should return false, the user cannot pay', () => {
        expect(
            getIsEligible({
                user: { ...eligibleUser, canPay: false },
                subscription: eligibleMailSubscription,
                protonConfig: validMailConfig,
                parentApp: APPS.PROTONMAIL,
            })
        ).toBeFalsy();
    });

    it('should return false, the user is delinquent', () => {
        expect(
            getIsEligible({
                user: { ...eligibleUser, isDelinquent: true },
                subscription: eligibleMailSubscription,
                protonConfig: validMailConfig,
                parentApp: APPS.PROTONMAIL,
            })
        ).toBeFalsy();
    });

    it('should return false, the user has a pass lifetime', () => {
        expect(
            getIsEligible({
                user: { ...eligibleUser, Flags: { 'pass-lifetime': true } as any },
                subscription: eligibleMailSubscription,
                protonConfig: validMailConfig,
                parentApp: APPS.PROTONMAIL,
            })
        ).toBeFalsy();
    });
});
