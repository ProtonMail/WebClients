import { APPS, COUPON_CODES, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { External, ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import isEligible from './eligibility';

describe('black-friday-mail-2022 offer', () => {
    it('should be available for Mail plus', () => {
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
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, protonConfig })).toBe(true);
    });

    it('should be available for Drive plus', () => {
        const subscription = {
            Plans: [
                {
                    Name: PLANS.DRIVE,
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
        expect(isEligible({ subscription, user, protonConfig })).toBe(true);
    });

    it('should be available for VPN plus', () => {
        const subscription = {
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
        expect(isEligible({ subscription, user, protonConfig })).toBe(true);
    });

    it('should not be available for trial', () => {
        const subscription = {
            CouponCode: COUPON_CODES.REFERRAL,
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
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, protonConfig })).toBe(false);
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

    it('should not be available for free', () => {
        const subscription = {} as Subscription;
        const user = {
            canPay: true,
            isFree: true,
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

    it('should not be available for external subscription', () => {
        const subscription = {
            Plans: [
                {
                    Name: PLANS.MAIL,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
            External: External.Android,
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
