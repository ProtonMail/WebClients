import { subDays } from 'date-fns';

import { COUPON_CODES, CYCLE, PLANS, PLAN_TYPES } from '@proton/payments';
import { External, type ProtonConfig, type Subscription, type UserModel } from '@proton/shared/lib/interfaces';

import { getIsEligible } from './eligibility';

const protonConfig = {
    APP_NAME: 'proton-mail',
} as unknown as ProtonConfig;

const defaultUser = {
    canPay: true,
    isDelinquent: false,
} as unknown as UserModel;

describe('go unlimites 2022 tests', () => {
    describe('Mail plus users', () => {
        it('should be eligible because they are yearly users', () => {
            expect(
                getIsEligible({
                    user: defaultUser,
                    protonConfig,
                    subscription: {
                        External: false,
                        Cycle: CYCLE.YEARLY,
                        CreateTime: subDays(Date.now(), 7).getTime() / 1000,
                        Plans: [
                            {
                                Type: PLAN_TYPES.PLAN,
                                Name: PLANS.MAIL,
                            },
                        ],
                    } as unknown as Subscription,
                })
            ).toBe(true);
        });

        it('should not be eligible because they are monthly users', () => {
            expect(
                getIsEligible({
                    user: defaultUser,
                    protonConfig,
                    subscription: {
                        External: false,
                        Cycle: CYCLE.MONTHLY,
                        CreateTime: subDays(Date.now(), 7).getTime() / 1000,
                        Plans: [
                            {
                                Type: PLAN_TYPES.PLAN,
                                Name: PLANS.MAIL,
                            },
                        ],
                    } as unknown as Subscription,
                })
            ).toBe(false);
        });
    });

    describe('VPN plus users', () => {
        it('should be eligible because they are yearly users', () => {
            expect(
                getIsEligible({
                    user: defaultUser,
                    protonConfig,
                    subscription: {
                        External: false,
                        Cycle: CYCLE.YEARLY,
                        CreateTime: subDays(Date.now(), 7).getTime() / 1000,
                        Plans: [
                            {
                                Type: PLAN_TYPES.PLAN,
                                Name: PLANS.VPN,
                            },
                        ],
                    } as unknown as Subscription,
                })
            ).toBe(true);
        });

        it('should be eligible because they are monthly users', () => {
            expect(
                getIsEligible({
                    user: defaultUser,
                    protonConfig,
                    subscription: {
                        External: false,
                        Cycle: CYCLE.MONTHLY,
                        CreateTime: subDays(Date.now(), 7).getTime() / 1000,
                        Plans: [
                            {
                                Type: PLAN_TYPES.PLAN,
                                Name: PLANS.VPN,
                            },
                        ],
                    } as unknown as Subscription,
                })
            ).toBe(true);
        });
    });

    describe('Common conditions tess', () => {
        it('should not be eligible since in trial', () => {
            expect(
                getIsEligible({
                    user: defaultUser,
                    protonConfig,
                    subscription: {
                        CouponCode: COUPON_CODES.REFERRAL,
                        External: false,
                        Cycle: CYCLE.MONTHLY,
                        CreateTime: subDays(Date.now(), 7).getTime() / 1000,
                        Plans: [
                            {
                                Type: PLAN_TYPES.PLAN,
                                Name: PLANS.MAIL,
                            },
                        ],
                    } as unknown as Subscription,
                })
            ).toBe(false);

            expect(
                getIsEligible({
                    user: defaultUser,
                    protonConfig,
                    subscription: {
                        IsTrial: false,
                        External: false,
                        Cycle: CYCLE.MONTHLY,
                        CreateTime: subDays(Date.now(), 7).getTime() / 1000,
                        Plans: [
                            {
                                Type: PLAN_TYPES.PLAN,
                                Name: PLANS.MAIL,
                            },
                        ],
                    } as unknown as Subscription,
                })
            ).toBe(false);
        });

        it('should not be eligible since subscription is 5 days old', () => {
            expect(
                getIsEligible({
                    user: { ...defaultUser, canPay: false },
                    protonConfig,
                    subscription: {
                        External: false,
                        Cycle: CYCLE.MONTHLY,
                        CreateTime: subDays(Date.now(), 5).getTime() / 1000,
                        Plans: [
                            {
                                Type: PLAN_TYPES.PLAN,
                                Name: PLANS.MAIL,
                            },
                        ],
                    } as unknown as Subscription,
                })
            ).toBe(false);
        });

        it('should not be eligible since cannot pay', () => {
            expect(
                getIsEligible({
                    user: { ...defaultUser, canPay: false },
                    protonConfig,
                    subscription: {
                        External: false,
                        Cycle: CYCLE.MONTHLY,
                        CreateTime: subDays(Date.now(), 7).getTime() / 1000,
                        Plans: [
                            {
                                Type: PLAN_TYPES.PLAN,
                                Name: PLANS.MAIL,
                            },
                        ],
                    } as unknown as Subscription,
                })
            ).toBe(false);
        });

        it('should not be eligible since delinquent pay', () => {
            expect(
                getIsEligible({
                    user: { ...defaultUser, isDelinquent: true },
                    protonConfig,
                    subscription: {
                        External: false,
                        Cycle: CYCLE.MONTHLY,
                        CreateTime: subDays(Date.now(), 7).getTime() / 1000,
                        Plans: [
                            {
                                Type: PLAN_TYPES.PLAN,
                                Name: PLANS.MAIL,
                            },
                        ],
                    } as unknown as Subscription,
                })
            ).toBe(false);
        });

        it('should not be eligible since is external', () => {
            expect(
                getIsEligible({
                    user: defaultUser,
                    protonConfig,
                    subscription: {
                        External: External.Android,
                        Cycle: CYCLE.MONTHLY,
                        CreateTime: subDays(Date.now(), 7).getTime() / 1000,
                        Plans: [
                            {
                                Type: PLAN_TYPES.PLAN,
                                Name: PLANS.MAIL,
                            },
                        ],
                    } as unknown as Subscription,
                })
            ).toBe(false);

            expect(
                getIsEligible({
                    user: defaultUser,
                    protonConfig,
                    subscription: {
                        External: External.iOS,
                        Cycle: CYCLE.MONTHLY,
                        CreateTime: subDays(Date.now(), 7).getTime() / 1000,
                        Plans: [
                            {
                                Type: PLAN_TYPES.PLAN,
                                Name: PLANS.MAIL,
                            },
                        ],
                    } as unknown as Subscription,
                })
            ).toBe(false);
        });
    });
});
