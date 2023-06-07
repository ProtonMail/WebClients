import { getUnixTime } from 'date-fns';

import { APPS, COUPON_CODES, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { External, ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import isEligible from './eligibility';

describe('summer-2023 offer', () => {
    it('should not be available in Proton VPN settings', () => {
        const user = {
            isFree: true,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONVPN_SETTINGS,
        } as ProtonConfig;
        expect(
            isEligible({
                user,
                protonConfig,
            })
        ).toBe(false);
    });

    it('should be available in Proton Mail', () => {
        const user = {
            isFree: true,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(
            isEligible({
                user,
                protonConfig,
            })
        ).toBe(true);
    });

    it('should be available in Proton Calendar', () => {
        const user = {
            isFree: true,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONCALENDAR,
        } as ProtonConfig;
        expect(
            isEligible({
                user,
                protonConfig,
            })
        ).toBe(true);
    });

    it('should be available for Mail Plus Trial users', () => {
        const user = {
            isFree: false,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        const subscription = {
            Plans: [{ Name: PLANS.MAIL, Type: PLAN_TYPES.PLAN }],
            CouponCode: COUPON_CODES.REFERRAL,
        } as Subscription;
        expect(
            isEligible({
                user,
                protonConfig,
                subscription,
            })
        ).toBe(true);
    });

    it('should not be available for subscription managed externaly', () => {
        const user = {
            isFree: false,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        const subscription = {
            Plans: [{ Name: PLANS.MAIL, Type: PLAN_TYPES.PLAN }],
            External: External.Android,
        } as Subscription;
        expect(
            isEligible({
                user,
                protonConfig,
                subscription,
            })
        ).toBe(false);
    });

    it('should not be available for delinquent users', () => {
        const user = {
            isFree: false,
            canPay: true,
            isDelinquent: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        expect(
            isEligible({
                user,
                protonConfig,
            })
        ).toBe(false);
    });

    it('should not be available for users with previous subscription', () => {
        const user = {
            isFree: true,
            canPay: true,
        } as UserModel;
        const protonConfig = {
            APP_NAME: APPS.PROTONMAIL,
        } as ProtonConfig;
        const now = new Date();
        const lastSubscriptionEnd = getUnixTime(now);
        expect(
            isEligible({
                user,
                protonConfig,
                lastSubscriptionEnd,
            })
        ).toBe(false);
    });
});
