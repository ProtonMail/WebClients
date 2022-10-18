import { getUnixTime } from 'date-fns';

import { APPS, COUPON_CODES, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { External, ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import isEligible from './eligibility';

describe('black-friday-vpn-3-deal-2022 offer', () => {
    it('should be available for free and not dowgrader', () => {
        const user = {
            isFree: true,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONVPN_SETTINGS,
        } as ProtonConfig;
        const lastSubscriptionEnd = 0;

        expect(isEligible({ user, protonConfig, lastSubscriptionEnd })).toBe(true);

        const invalidLastSubscriptionEnd = getUnixTime(new Date(2022, 9, 2, 0, 0, 0)); // October 2 2022 00:00:00 UTC

        expect(isEligible({ user, protonConfig, lastSubscriptionEnd: invalidLastSubscriptionEnd })).toBe(false);
    });

    it('should be available for trial', () => {
        const user = {
            isFree: false,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONVPN_SETTINGS,
        } as ProtonConfig;
        const subscription = {
            CouponCode: COUPON_CODES.REFERRAL,
            Plans: [
                {
                    Name: PLANS.MAIL,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;

        expect(isEligible({ user, protonConfig, subscription })).toBe(true);
    });

    it('should not be available for delinquent', () => {
        const user = {
            isFree: true,
            canPay: true,
            isDelinquent: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONVPN_SETTINGS,
        } as ProtonConfig;

        expect(isEligible({ user, protonConfig })).toBe(false);
    });

    it('should not be available for external', () => {
        const user = {
            isFree: true,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONVPN_SETTINGS,
        } as ProtonConfig;
        const subscription = {
            CouponCode: COUPON_CODES.REFERRAL,
            External: External.Android,
            Plans: [
                {
                    Name: PLANS.MAIL,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;

        expect(isEligible({ user, protonConfig, subscription })).toBe(false);
    });

    it('should not be available in Mail app', () => {
        const user = {
            isFree: true,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;

        expect(isEligible({ user, protonConfig })).toBe(false);
    });
});
