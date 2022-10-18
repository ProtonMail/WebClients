import { APPS, COUPON_CODES, CYCLE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { External, ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import isEligible from './eligibility';

describe('black-friday-vpn-1-deal-2022 offer', () => {
    it('should should be available for Mail, even with MAILBF2022', () => {
        const user = {
            canPay: true,
        } as UserModel;
        const subscription = {
            Plans: [{ Name: PLANS.MAIL, Type: PLAN_TYPES.PLAN }],
            CouponCode: COUPON_CODES.MAIL_BLACK_FRIDAY_2022,
        } as Subscription;
        const protonConfig = { APP_NAME: APPS.PROTONVPN_SETTINGS } as ProtonConfig;
        expect(isEligible({ subscription, user, protonConfig })).toBe(true);
    });

    it('should should be available for Drive', () => {
        const user = {
            canPay: true,
        } as UserModel;
        const subscription = { Plans: [{ Name: PLANS.DRIVE, Type: PLAN_TYPES.PLAN }] } as Subscription;
        const protonConfig = { APP_NAME: APPS.PROTONVPN_SETTINGS } as ProtonConfig;
        expect(isEligible({ subscription, user, protonConfig })).toBe(true);
    });

    it('should be available for VPN 2 years', () => {
        const user = {
            canPay: true,
        } as UserModel;
        const subscription = {
            Plans: [{ Name: PLANS.VPN, Type: PLAN_TYPES.PLAN }],
            Cycle: CYCLE.TWO_YEARS,
        } as Subscription;
        const protonConfig = { APP_NAME: APPS.PROTONVPN_SETTINGS } as ProtonConfig;
        expect(isEligible({ subscription, user, protonConfig })).toBe(true);
    });

    it('should not be available for delinquent users', () => {
        const user = {
            canPay: true,
            isDelinquent: true,
        } as UserModel;
        const subscription = { Plans: [{ Name: PLANS.MAIL, Type: PLAN_TYPES.PLAN }] } as Subscription;
        const protonConfig = { APP_NAME: APPS.PROTONVPN_SETTINGS } as ProtonConfig;
        expect(isEligible({ subscription, user, protonConfig })).toBe(false);
    });

    it('should not be available for external users', () => {
        const user = {
            canPay: true,
        } as UserModel;
        const subscription = {
            Plans: [{ Name: PLANS.MAIL, Type: PLAN_TYPES.PLAN }],
            External: External.Android,
        } as Subscription;
        const protonConfig = { APP_NAME: APPS.PROTONVPN_SETTINGS } as ProtonConfig;
        expect(isEligible({ subscription, user, protonConfig })).toBe(false);
    });
});
