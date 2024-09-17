import { getPlansMap } from '@proton/payments';
import { APPS, COUPON_CODES, CYCLE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import type { Subscription } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { getTestPlans } from '@proton/testing/data';

import {
    drivePlusUpsell,
    duoUpsell,
    familyUpsell,
    mailPlusUpsell,
    mailProfessionalUpsell,
    passPlusUpsell,
    subscription,
    subscriptionBundle,
    trialMailPlusUpsell,
    unlimitedUpsell,
    vpnBusinessUpsell,
    vpnEnterpriseUpsell,
} from '../__mocks__/data';
import { SUBSCRIPTION_STEPS } from '../constants';
import { resolveUpsellsToDisplay } from './dashboard-upsells';

describe('resolveUpsellsToDisplay', () => {
    let mockedOpenSubscriptionModal: jest.Mock;
    let base: Parameters<typeof resolveUpsellsToDisplay>[0];

    beforeEach(() => {
        mockedOpenSubscriptionModal = jest.fn();
        base = {
            app: APPS.PROTONMAIL,
            subscription,
            freePlan: FREE_PLAN,
            serversCount: {
                paid: {
                    servers: 100,
                    countries: 10,
                },
                free: {
                    servers: 10,
                    countries: 1,
                },
            },
            canPay: true,
            isFree: true,
            hasPaidMail: false,
            openSubscriptionModal: mockedOpenSubscriptionModal,
            plansMap: getPlansMap(getTestPlans('EUR'), 'EUR'),
        };
    });

    describe('Free Mail', () => {
        it('should return MailPlus + Unlimited (recommended) upsells', () => {
            const upsells = resolveUpsellsToDisplay(base);
            expect(upsells).toMatchObject([mailPlusUpsell, { ...unlimitedUpsell, isRecommended: true }]);

            upsells[0].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                disablePlanSelection: true,
                plan: PLANS.MAIL,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.BUNDLE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });
        });
    });

    describe('Free Trial', () => {
        it('should return MailPlus + Unlimited (recommended) upsells if user has Mail Plus trial', () => {
            const upsells = resolveUpsellsToDisplay({
                ...base,
                subscription: {
                    ...base.subscription,
                    CouponCode: COUPON_CODES.REFERRAL,
                    PeriodEnd: 1718870501,
                } as Subscription,
            });

            // .toMatchObject can't match functions, so we need to remove them
            const trialMailPlusUpsellWithoutAction = {
                ...trialMailPlusUpsell,
                otherCtas: trialMailPlusUpsell.otherCtas.map(({ action, ...rest }) => rest),
            };

            expect(upsells).toMatchObject([
                trialMailPlusUpsellWithoutAction,
                { ...unlimitedUpsell, isRecommended: true },
            ]);

            upsells[0].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                disablePlanSelection: true,
                plan: PLANS.MAIL,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.BUNDLE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });
        });

        it('should return Unlimited (recommended) upsell if user has Unlimited trial', () => {
            const upsells = resolveUpsellsToDisplay({
                ...base,
                subscription: {
                    ...subscriptionBundle,
                    CouponCode: COUPON_CODES.MEMBER_DOWNGRADE_TRIAL,
                    PeriodEnd: 1718870501,
                } as Subscription,
            });

            const unlimitedUpsellWithoutAction = {
                ...unlimitedUpsell,
                title: 'Proton Unlimited Trial',
                otherCtas: [
                    {
                        action: expect.any(Function),
                        label: 'Explore all Proton plans',
                        shape: 'ghost',
                        color: 'norm',
                    },
                ],
            };

            expect(upsells).toMatchObject([unlimitedUpsellWithoutAction]);

            upsells[0].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.BUNDLE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });
        });
    });

    describe('Mail Plus', () => {
        it('should return Unlimited (recommended) + Family upsells', () => {
            const upsells = resolveUpsellsToDisplay({
                ...base,
                subscription: {
                    Plans: [
                        {
                            Name: PLANS.MAIL,
                            Type: PLAN_TYPES.PLAN,
                        },
                    ],
                } as Subscription,
                isFree: false,
                hasPaidMail: true,
            });

            expect(upsells).toMatchObject([
                {
                    ...unlimitedUpsell,
                    isRecommended: true,
                },
                familyUpsell,
            ]);

            upsells[0].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.BUNDLE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });
        });

        it('should return Unlimited (recommended) + Duo + Family upsells', () => {
            const upsells = resolveUpsellsToDisplay({
                ...base,
                subscription: {
                    Plans: [
                        {
                            Name: PLANS.MAIL,
                            Type: PLAN_TYPES.PLAN,
                        },
                    ],
                } as Subscription,
                isFree: false,
                hasPaidMail: true,
                canAccessDuoPlan: true,
            });

            const [firstUnlimitedUpsellFeature, ...restUnlimitedUpsellFeatures] = unlimitedUpsell.features;
            expect(upsells).toMatchObject([
                {
                    ...unlimitedUpsell,
                    features: [
                        firstUnlimitedUpsellFeature,
                        {
                            text: '1 user',
                            icon: 'users',
                            included: true,
                        },
                        ...restUnlimitedUpsellFeatures,
                    ],
                    isRecommended: true,
                },
                duoUpsell,
            ]);

            upsells[0].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.BUNDLE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.DUO,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });
        });
    });

    describe('Unlimited', () => {
        it('should return Family upsell', () => {
            const [upsell] = resolveUpsellsToDisplay({
                ...base,
                isFree: false,
                hasPaidMail: true,
                subscription: {
                    Plans: [
                        {
                            Name: PLANS.BUNDLE,
                            Type: PLAN_TYPES.PLAN,
                        },
                    ],
                } as Subscription,
            });

            expect(upsell).toMatchObject(familyUpsell);

            upsell.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });
        });

        it('should return Duo and Family upsell', () => {
            const upsells = resolveUpsellsToDisplay({
                ...base,
                isFree: false,
                hasPaidMail: true,
                subscription: {
                    Plans: [
                        {
                            Name: PLANS.BUNDLE,
                            Type: PLAN_TYPES.PLAN,
                        },
                    ],
                } as Subscription,
                canAccessDuoPlan: true,
            });

            expect(upsells).toMatchObject([{ ...duoUpsell, isRecommended: true }, familyUpsell]);

            upsells[0].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.DUO,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });
        });
    });

    describe('Duo', () => {
        it('should return Family upsell', () => {
            const [upsell] = resolveUpsellsToDisplay({
                ...base,
                isFree: false,
                hasPaidMail: true,
                subscription: {
                    Plans: [
                        {
                            Name: PLANS.DUO,
                            Type: PLAN_TYPES.PLAN,
                        },
                    ],
                } as Subscription,
            });

            expect(upsell).toMatchObject(familyUpsell);

            upsell.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });
        });

        it('should return Duo and Family upsell', () => {
            const upsells = resolveUpsellsToDisplay({
                ...base,
                isFree: false,
                hasPaidMail: true,
                subscription: {
                    Plans: [
                        {
                            Name: PLANS.BUNDLE,
                            Type: PLAN_TYPES.PLAN,
                        },
                    ],
                } as Subscription,
                canAccessDuoPlan: true,
            });

            expect(upsells).toMatchObject([{ ...duoUpsell, isRecommended: true }, familyUpsell]);

            upsells[0].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.DUO,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });
        });
    });

    describe('Essentials', () => {
        it('should return Mail Business upsell', () => {
            const [upsell] = resolveUpsellsToDisplay({
                ...base,
                isFree: false,
                hasPaidMail: true,
                subscription: {
                    Plans: [
                        {
                            Name: PLANS.MAIL_PRO,
                            Type: PLAN_TYPES.PLAN,
                        },
                    ],
                } as Subscription,
            });

            expect(upsell).toMatchObject(mailProfessionalUpsell);

            upsell.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.MAIL_BUSINESS,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });
        });
    });

    describe('Free Drive', () => {
        it('should return Drive upsell', () => {
            const [upsell] = resolveUpsellsToDisplay({
                ...base,
                app: APPS.PROTONDRIVE,
                isFree: true,
            });

            expect(upsell).toMatchObject(drivePlusUpsell);

            upsell.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.DRIVE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });
        });
    });

    describe('Free Pass', () => {
        it('should return Pass upsell', () => {
            const [upsell] = resolveUpsellsToDisplay({
                ...base,
                app: APPS.PROTONPASS,
                isFree: true,
            });

            expect(upsell).toMatchObject(passPlusUpsell);

            upsell.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.PASS,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });
        });
    });

    describe('VPN Essentials', () => {
        it('should return VPN Business and VPN Enterprise upselss', () => {
            const upsells = resolveUpsellsToDisplay({
                ...base,
                subscription: {
                    Plans: [
                        {
                            Name: PLANS.VPN_PRO,
                            Type: PLAN_TYPES.PLAN,
                        },
                    ],
                } as Subscription,
                app: APPS.PROTONACCOUNT,
                isFree: false,
            });

            const [upsell1, upsell2] = upsells;

            expect(upsell1).toMatchObject(vpnBusinessUpsell);

            upsell1.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.VPN_BUSINESS,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });

            expect(upsell2).toMatchObject(vpnEnterpriseUpsell);
            expect(upsell2.ignoreDefaultCta).toEqual(true);
            expect(upsell2.otherCtas).toHaveLength(1);

            upsell2.onUpgrade();
            // that's right, the VPN Enterprise upsell should not call the modal. It must have noop because it has
            // custom CTA. The 1 comes from the previous call
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
        });
    });

    describe('VPN Business', () => {
        it('should return VPN Enterprise upsell', () => {
            const [upsell] = resolveUpsellsToDisplay({
                ...base,
                subscription: {
                    Plans: [
                        {
                            Name: PLANS.VPN_BUSINESS,
                            Type: PLAN_TYPES.PLAN,
                        },
                    ],
                } as Subscription,
                app: APPS.PROTONACCOUNT,
                isFree: false,
            });

            expect(upsell).toMatchObject(vpnEnterpriseUpsell);
            expect(upsell.ignoreDefaultCta).toEqual(true);
            expect(upsell.otherCtas).toHaveLength(1);

            upsell.onUpgrade();
            expect(mockedOpenSubscriptionModal).not.toHaveBeenCalled();
        });
    });
});
