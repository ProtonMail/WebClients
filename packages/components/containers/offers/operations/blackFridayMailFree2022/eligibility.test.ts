import { getUnixTime } from 'date-fns';

import { APPS, COUPON_CODES, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import isEligible from './eligibility';

describe('black-friday-mail-free-2022 offer', () => {
    it('should be available for free user', () => {
        const user = {
            isFree: true,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ user, protonConfig })).toBe(true);
    });

    it('should be available for trial', () => {
        const user = {
            isFree: false,
            canPay: true,
        } as UserModel;
        const subscription = {
            CouponCode: COUPON_CODES.REFERRAL,
            Plans: [
                {
                    Name: PLANS.PLUS,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ user, subscription, protonConfig })).toBe(true);
    });

    it('should not be available for downgrader', () => {
        const user = {
            isFree: true,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        const lastSubscriptionEnd = getUnixTime(new Date(2022, 9, 2, 0, 0, 0)); // October 2 2022 00:00:00 UTC
        expect(isEligible({ user, protonConfig, lastSubscriptionEnd })).toBe(false);
    });

    it('should not be available for delinquent', () => {
        const subscription = {
            Plans: [
                {
                    Name: PLANS.MAIL,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const user = {
            canPay: true,
            isDelinquent: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, protonConfig })).toBe(false);
    });

    it('should not be available for non payer', () => {
        const subscription = {
            Plans: [
                {
                    Name: PLANS.MAIL,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const user = {
            canPay: false,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, protonConfig })).toBe(false);
    });

    it('should not be available in VPN application', () => {
        const subscription = {
            Plans: [
                {
                    Name: PLANS.MAIL,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const user = {
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONVPN_SETTINGS,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, protonConfig })).toBe(false);
    });

    it('should not be available with Black Friday VPN coupon code', () => {
        const subscription = {
            CouponCode: COUPON_CODES.VPN_BLACK_FRIDAY_2022,
            Plans: [
                {
                    Name: PLANS.VPN,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const user = {
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, protonConfig })).toBe(false);
    });
});
