import {
    CYCLE,
    FREE_PLAN,
    PLANS,
    PLAN_TYPES,
    type Subscription,
    SubscriptionPlatform,
    getPlansMap,
} from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { buildSubscription, buildUser } from '@proton/testing/builders';
import { getTestPlans } from '@proton/testing/data';

import {
    bundle2024Upsell,
    drivePlusUpsell,
    duoUpsell,
    familyUpsell,
    mailPlusUpsell,
    passPlusUpsell,
    subscriptionMail,
    unlimitedUpsell,
    vpnBusinessUpsell,
} from '../__mocks__/data';
import { SUBSCRIPTION_STEPS } from '../constants';
import { resolveUpsellsToDisplay } from './dashboard-upsells';

const vpnPassProUpsell = {
    plan: PLANS.VPN_PASS_BUNDLE_BUSINESS,
    planKey: PLANS.VPN_PASS_BUNDLE_BUSINESS,
    title: 'VPN and Pass Professional',
    description: 'Advanced account and network security in one plan',
    otherCtas: [],
    price: {
        value: 1099,
        currency: 'EUR',
    },
};

describe('resolveUpsellsToDisplay', () => {
    let mockedOpenSubscriptionModal: jest.Mock;
    let base: Parameters<typeof resolveUpsellsToDisplay>[0];

    beforeEach(() => {
        mockedOpenSubscriptionModal = jest.fn();
        base = {
            app: APPS.PROTONMAIL,
            subscription: subscriptionMail,
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
            user: buildUser(),
            telemetryFlow: 'subscription',
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
                telemetryFlow: 'subscription',
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.BUNDLE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
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
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.BUNDLE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
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
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.BUNDLE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.DUO,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
            });
        });
    });

    describe('Unlimited', () => {
        it('should return Family upsell', () => {
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
            });

            const upsell = upsells[0];
            expect(upsell).toMatchObject(familyUpsell);

            upsell.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
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
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.DUO,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
            });
        });

        it('should not return multi user personal plans if user has Lumo mobile subscription', () => {
            const upsells = resolveUpsellsToDisplay({
                ...base,
                isFree: false,
                hasPaidMail: true,
                subscription: buildSubscription(PLANS.BUNDLE, {
                    External: SubscriptionPlatform.Default,
                    SecondarySubscriptions: [
                        buildSubscription(PLANS.LUMO, {
                            External: SubscriptionPlatform.Android,
                        }),
                    ],
                }),
            });

            expect(upsells).not.toMatchObject([familyUpsell, duoUpsell]);
            expect(upsells).toEqual([]);
        });
    });

    describe('Duo', () => {
        it('should return Family upsell', () => {
            const upsells = resolveUpsellsToDisplay({
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

            const upsell = upsells[0];
            expect(upsell).toMatchObject(familyUpsell);

            upsell.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
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
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.DUO,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
            });
        });

        it('should not return multi user personal plans if user has Lumo mobile subscription', () => {
            const upsells = resolveUpsellsToDisplay({
                ...base,
                isFree: false,
                hasPaidMail: true,
                subscription: buildSubscription(PLANS.DUO, {
                    External: SubscriptionPlatform.Default,
                    SecondarySubscriptions: [
                        buildSubscription(PLANS.LUMO, {
                            External: SubscriptionPlatform.Android,
                        }),
                    ],
                }),
            });

            expect(upsells).not.toMatchObject([familyUpsell, duoUpsell]);
            expect(upsells).toEqual([]);
        });
    });

    describe('Essentials', () => {
        it('should return Mail Business upsell', () => {
            const upsells = resolveUpsellsToDisplay({
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

            const upsell = upsells[0];
            expect(upsell).toMatchObject(bundle2024Upsell);

            upsell.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.BUNDLE_PRO_2024,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
            });
        });
    });

    describe('Free Drive', () => {
        it('should return Drive upsell', () => {
            const upsells = resolveUpsellsToDisplay({
                ...base,
                app: APPS.PROTONDRIVE,
                isFree: true,
            });

            const upsell = upsells[0];
            expect(upsell).toMatchObject(drivePlusUpsell);

            upsell.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.DRIVE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
            });
        });
    });

    describe('Free Pass', () => {
        it('should return Pass upsell', () => {
            const upsells = resolveUpsellsToDisplay({
                ...base,
                app: APPS.PROTONPASS,
                isFree: true,
            });

            const upsell = upsells[0];
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
                telemetryFlow: 'subscription',
            });
        });
    });

    describe('VPN Essentials', () => {
        it('should return VPN Business and VPN and Pass Professional upsells', () => {
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
            const upsell1 = upsells[0];
            const upsell2 = upsells[1];

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

            expect(upsell2).toMatchObject(vpnPassProUpsell);

            upsell2.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: CYCLE.YEARLY,
                plan: PLANS.VPN_PASS_BUNDLE_BUSINESS,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
            });
        });
    });

    describe('VPN Business', () => {
        it('should return VPN and Pass Professional and bundle pro upsells', () => {
            const upsells = resolveUpsellsToDisplay({
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

            const upsell1 = upsells[0];
            expect(upsell1).toMatchObject(vpnPassProUpsell);

            upsell1.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.YEARLY,
                plan: PLANS.VPN_PASS_BUNDLE_BUSINESS,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
                metrics: {
                    source: 'upsells',
                },
                telemetryFlow: 'subscription',
            });

            const upsell2 = upsells[1];
            expect(upsell2).toMatchObject(bundle2024Upsell);
            expect(upsell2.otherCtas).toHaveLength(0);

            upsell2.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: CYCLE.YEARLY,
                plan: PLANS.BUNDLE_PRO_2024,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
                metrics: {
                    source: 'upsells',
                },
            });
        });
    });
});
