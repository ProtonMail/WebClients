import { APPS, CYCLE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { External, ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import isEligible from './eligibility';

describe('black-friday-vpn-2-deal-2022 offer', () => {
    it('should be available for VPN 1 year in VPN app', () => {
        const user = {
            canPay: true,
        } as UserModel;
        const subscription = {
            Cycle: CYCLE.YEARLY,
            Plans: [
                {
                    Name: PLANS.VPN,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const protonConfig = { APP_NAME: APPS.PROTONVPN_SETTINGS } as ProtonConfig;
        expect(isEligible({ user, subscription, protonConfig })).toBe(true);
        expect(isEligible({ user, subscription: { ...subscription, Cycle: CYCLE.MONTHLY }, protonConfig })).toBe(false);
        expect(
            isEligible({ user, subscription, protonConfig: { ...protonConfig, APP_NAME: APPS.PROTONACCOUNT } })
        ).toBe(false);
        expect(isEligible({ user: { ...user, hasPaidMail: true }, subscription, protonConfig })).toBe(false);
    });

    it('should not be available for delinquent users', () => {
        const user = {
            canPay: true,
            isDelinquent: true,
        } as UserModel;
        const subscription = {
            Cycle: CYCLE.YEARLY,
            Plans: [
                {
                    Name: PLANS.VPN,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
        } as Subscription;
        const protonConfig = { APP_NAME: APPS.PROTONVPN_SETTINGS } as ProtonConfig;
        expect(isEligible({ user, subscription, protonConfig })).toBe(false);
    });

    it('should not be available for external users', () => {
        const user = {
            canPay: true,
        } as UserModel;
        const subscription = {
            Cycle: CYCLE.YEARLY,
            Plans: [
                {
                    Name: PLANS.VPN,
                    Type: PLAN_TYPES.PLAN,
                },
            ],
            External: External.Android,
        } as Subscription;
        const protonConfig = { APP_NAME: APPS.PROTONVPN_SETTINGS } as ProtonConfig;
        expect(isEligible({ user, subscription, protonConfig })).toBe(false);
    });
});
