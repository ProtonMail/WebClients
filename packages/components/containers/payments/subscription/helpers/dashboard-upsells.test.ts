import { IcUsers } from '@proton/icons/icons/IcUsers';
import { ADDON_NAMES, CYCLE, PLANS, PLAN_TYPES } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import {
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getTestPlans } from '@proton/payments/testing/data-plans';
import { APPS } from '@proton/shared/lib/constants';
import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';
import { buildUser } from '@proton/shared/testing/buildUser';

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
} from '../../../../testing/subscriptionData';
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
            canPay: true,
            isFree: true,
            hasPaidMail: false,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(subscriptionMail),
            openSubscriptionModal: mockedOpenSubscriptionModal,
            plansMap: getPlansMap(getTestPlans('EUR'), 'EUR'),
            user: buildUser(),
            telemetryFlow: 'subscription',
        };
    });

    describe('feature ids', () => {
        it('are unique within every upsell the dashboard can render', () => {
            const plans = [
                undefined,
                PLANS.MAIL,
                PLANS.DRIVE,
                PLANS.VPN2024,
                PLANS.PASS,
                PLANS.BUNDLE,
                PLANS.DUO,
                PLANS.FAMILY,
                PLANS.LUMO,
                PLANS.MAIL_PRO,
                PLANS.MAIL_BUSINESS,
                PLANS.BUNDLE_PRO_2024,
                PLANS.VPN_PRO,
                PLANS.VPN_BUSINESS,
                PLANS.MEET_BUSINESS,
            ];
            const apps = [
                APPS.PROTONMAIL,
                APPS.PROTONDRIVE,
                APPS.PROTONVPN_SETTINGS,
                APPS.PROTONPASS,
                APPS.PROTONCALENDAR,
            ];

            const duplicates: string[] = [];
            let upsellCount = 0;

            for (const app of apps) {
                for (const planName of plans) {
                    const upsells = resolveUpsellsToDisplay({
                        ...base,
                        app,
                        isFree: !planName,
                        hasPaidMail: planName === PLANS.MAIL || planName === PLANS.BUNDLE,
                        subscription: planName
                            ? buildSubscription({ planName, cycle: CYCLE.MONTHLY, currency: 'EUR' })
                            : undefined,
                    });

                    for (const upsell of upsells) {
                        upsellCount++;
                        const ids = upsell.features.map(({ id }) => id);
                        const seen = new Set<string>();
                        ids.filter((id) => !seen.add(id)).forEach((id) => {
                            duplicates.push(`${app} on ${planName ?? 'free'} -> ${upsell.planKey}: ${id}`);
                        });
                    }
                }
            }

            expect(duplicates).toEqual([]);
            // A guard against the matrix silently producing no upsells at all.
            expect(upsellCount).toBeGreaterThan(50);
        });
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
                telemetryFlow: 'subscription',
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.BUNDLE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
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
                telemetryFlow: 'subscription',
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
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
                            icon: IcUsers,
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
                telemetryFlow: 'subscription',
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.DUO,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
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
                telemetryFlow: 'subscription',
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                telemetryFlow: 'subscription',
            });
        });

        it('should not return multi user personal plans if user has Lumo mobile subscription', () => {
            const subscription = buildSubscription(PLANS.BUNDLE, {
                External: SubscriptionPlatform.Default,
                SecondarySubscriptions: [
                    buildSubscription(PLANS.LUMO, {
                        External: SubscriptionPlatform.Android,
                    }),
                ],
            });
            const upsells = resolveUpsellsToDisplay({
                ...base,
                isFree: false,
                hasPaidMail: true,
                subscription,
                multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(subscription),
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
                telemetryFlow: 'subscription',
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.YEARLY,
                disablePlanSelection: true,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                telemetryFlow: 'subscription',
            });
        });

        it('should not return multi user personal plans if user has Lumo mobile subscription', () => {
            const subscription = buildSubscription(PLANS.DUO, {
                External: SubscriptionPlatform.Default,
                SecondarySubscriptions: [
                    buildSubscription(PLANS.LUMO, {
                        External: SubscriptionPlatform.Android,
                    }),
                ],
            });
            const upsells = resolveUpsellsToDisplay({
                ...base,
                isFree: false,
                hasPaidMail: true,
                subscription,
                multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(subscription),
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
            });

            expect(upsell2).toMatchObject(vpnPassProUpsell);

            upsell2.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: CYCLE.YEARLY,
                plan: PLANS.VPN_PASS_BUNDLE_BUSINESS,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
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
            });
        });
    });

    describe('Lumo app upsells with the Lumo purchase rules', () => {
        const getUpsellPlans = (subscription: Subscription, lumoMultiSubscriptions: boolean) => {
            return resolveUpsellsToDisplay({
                ...base,
                app: APPS.PROTONLUMO,
                isFree: false,
                subscription,
                multiSubscriptionContext: buildMultiSubscriptionContext([subscription], lumoMultiSubscriptions),
            }).map((upsell) => upsell.planKey);
        };

        it('offers Lumo Plus to a Mail Plus subscriber only with the flag on', () => {
            const subscription = buildSubscription(PLANS.MAIL);

            expect(getUpsellPlans(subscription, false)).toEqual([PLANS.BUNDLE, PLANS.FAMILY]);
            expect(getUpsellPlans(subscription, true)).toEqual([PLANS.LUMO]);
        });

        it('keeps the usual upsells for a Unlimited subscriber who already has Lumo Plus', () => {
            const unlimited = buildSubscription(PLANS.BUNDLE);
            const lumoPlus = buildSubscription(PLANS.LUMO);

            const upsells = resolveUpsellsToDisplay({
                ...base,
                app: APPS.PROTONLUMO,
                isFree: false,
                subscription: unlimited,
                multiSubscriptionContext: buildMultiSubscriptionContext([unlimited, lumoPlus]),
            }).map((upsell) => upsell.planKey);

            expect(upsells).toEqual([PLANS.FAMILY]);
        });

        it('offers no Lumo plan to a Mail Plus subscriber who has the Lumo addon, with the flag on', () => {
            const subscription = buildSubscription({ [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 });

            expect(getUpsellPlans(subscription, true)).toEqual([PLANS.BUNDLE, PLANS.FAMILY]);
        });

        it('offers no Lumo plan to a Family subscriber with the flag on', () => {
            expect(getUpsellPlans(buildSubscription(PLANS.FAMILY), true)).toEqual([]);
        });
    });
});
