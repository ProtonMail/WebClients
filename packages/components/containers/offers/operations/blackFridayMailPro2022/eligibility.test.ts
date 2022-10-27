import { APPS, COUPON_CODES, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { External, Organization, ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import isEligible from './eligibility';

describe('black-friday-mail-pro-2022 offer', () => {
    it('should not be available for free user', () => {
        const user = {
            isFree: true,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ user, protonConfig })).toBe(false);
    });

    it('should not be available for trial', () => {
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
        expect(isEligible({ user, subscription, protonConfig })).toBe(false);
    });

    it('should be available for Unlimited', () => {
        const user = {
            isFree: false,
            canPay: true,
        } as UserModel;
        const subscription = {
            RenewAmount: 1500,
            Plans: [
                {
                    Name: PLANS.BUNDLE,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const organization = {
            MaxMembers: 1,
        } as Organization;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ user, subscription, protonConfig, organization })).toBe(true);
    });

    it('should be available for Business', () => {
        const user = {
            isFree: false,
            canPay: true,
        } as UserModel;
        const subscription = {
            RenewAmount: 1500,
            Plans: [
                {
                    Name: PLANS.BUNDLE_PRO,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const organization = {
            MaxMembers: 1,
        } as Organization;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ user, subscription, protonConfig, organization })).toBe(true);
    });

    it('should be available for Mail Essentials', () => {
        const user = {
            isFree: false,
            canPay: true,
        } as UserModel;
        const subscription = {
            RenewAmount: 1500,
            Plans: [
                {
                    Name: PLANS.MAIL_PRO,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const organization = {
            MaxMembers: 1,
        } as Organization;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ user, subscription, protonConfig, organization })).toBe(true);
    });

    it('should not be available for delinquent', () => {
        const user = {
            isFree: false,
            canPay: true,
            isDelinquent: true,
        } as UserModel;
        const subscription = {
            RenewAmount: 1500,
            Plans: [
                {
                    Name: PLANS.BUNDLE,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const organization = {
            MaxMembers: 1,
        } as Organization;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, organization, protonConfig })).toBe(false);
    });

    it('should not be available for non payer', () => {
        const user = {
            isFree: false,
            canPay: false,
        } as UserModel;
        const subscription = {
            RenewAmount: 1500,
            Plans: [
                {
                    Name: PLANS.BUNDLE,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const organization = {
            MaxMembers: 1,
        } as Organization;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, organization, protonConfig })).toBe(false);
    });

    it('should not be available in VPN application', () => {
        const user = {
            isFree: false,
            canPay: true,
        } as UserModel;
        const subscription = {
            RenewAmount: 1500,
            Plans: [
                {
                    Name: PLANS.BUNDLE,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const organization = {
            MaxMembers: 1,
        } as Organization;
        const protonConfig = {
            APP_NAME: APPS.PROTONVPN_SETTINGS,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, organization, protonConfig })).toBe(false);
    });

    it('should not be available for organization with more than 5 members', () => {
        const user = {
            isFree: false,
            canPay: true,
        } as UserModel;
        const subscription = {
            RenewAmount: 1500,
            Plans: [
                {
                    Name: PLANS.BUNDLE,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const organization = {
            MaxMembers: 6,
        } as Organization;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, organization, protonConfig })).toBe(false);
    });

    it('should not be available with Black Friday VPN coupon', () => {
        const user = {
            isFree: false,
            canPay: true,
        } as UserModel;
        const subscription = {
            RenewAmount: 1500,
            CouponCode: COUPON_CODES.VPN_BLACK_FRIDAY_2022,
            Plans: [
                {
                    Name: PLANS.BUNDLE,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const organization = {
            MaxMembers: 1,
        } as Organization;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, organization, protonConfig })).toBe(false);
    });

    it('should not be available for higher amount', () => {
        const user = {
            isFree: false,
            canPay: true,
        } as UserModel;
        const subscription = {
            RenewAmount: 99999,
            Plans: [
                {
                    Name: PLANS.BUNDLE,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const organization = {
            MaxMembers: 1,
        } as Organization;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, organization, protonConfig })).toBe(false);
    });

    it('should not be available for external subscription', () => {
        const user = {
            isFree: false,
            canPay: true,
        } as UserModel;
        const subscription = {
            External: External.iOS,
            RenewAmount: 1500,
            Plans: [
                {
                    Name: PLANS.BUNDLE,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const organization = {
            MaxMembers: 1,
        } as Organization;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, organization, protonConfig })).toBe(false);
    });

    it('should not be available for organization with more than 5 members', () => {
        const user = {
            canPay: true,
            isFree: false,
            isDelinquent: false,
        } as UserModel;
        const subscription = {
            RenewAmount: 1500,
            Plans: [
                {
                    Name: PLANS.BUNDLE,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const organization = {
            MaxMembers: 6,
        } as Organization;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(isEligible({ subscription, user, organization, protonConfig })).toBe(false);
    });
});
