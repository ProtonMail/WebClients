import { APPS, COUPON_CODES, CYCLE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { Subscription } from '@proton/shared/lib/interfaces';

import {
    businessUpsell,
    drivePlusUpsell,
    familyUpsell,
    mailPlusUpsell,
    passPlusUpsell,
    plans,
    subscription,
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
            currency: 'EUR',
            subscription,
            plans,
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
        it('should return MailPlus + Unlimited (recommended) upsells', () => {
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
    });

    describe('Mail Plus', () => {
        it('should return Unlimited (recommended) + Family upsells', () => {
            const upsells = resolveUpsellsToDisplay({
                ...base,
                isFree: false,
                hasPaidMail: true,
            });

            expect(upsells).toMatchObject([
                {
                    ...unlimitedUpsell,
                    isRecommended: true,
                    features: unlimitedUpsell.features.filter(({ text }) => text !== '25 calendars'),
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
    });

    describe('Essentials', () => {
        it('should return Business upsell', () => {
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

            expect(upsell).toMatchObject(businessUpsell);

            upsell.onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(1);
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledWith({
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.BUNDLE_PRO,
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
                cycle: CYCLE.TWO_YEARS,
                disablePlanSelection: true,
                plan: PLANS.PASS_PLUS,
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
                step: SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION,
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
