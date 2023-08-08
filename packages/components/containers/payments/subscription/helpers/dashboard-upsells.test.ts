import { APPS, COUPON_CODES, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
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
} from '../__mocks__/data';
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
            plans: plans,
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
                plan: 'mail2022',
                step: 3,
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: 24,
                disablePlanSelection: true,
                plan: 'bundle2022',
                step: 3,
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
                plan: 'mail2022',
                step: 3,
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: 24,
                disablePlanSelection: true,
                plan: 'bundle2022',
                step: 3,
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
                cycle: 24,
                disablePlanSelection: true,
                plan: 'bundle2022',
                step: 3,
            });

            upsells[1].onUpgrade();
            expect(mockedOpenSubscriptionModal).toHaveBeenCalledTimes(2);
            expect(mockedOpenSubscriptionModal).toHaveBeenLastCalledWith({
                cycle: 24,
                disablePlanSelection: true,
                plan: 'family2022',
                step: 3,
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
                cycle: 24,
                disablePlanSelection: true,
                plan: 'family2022',
                step: 3,
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
                cycle: 24,
                disablePlanSelection: true,
                plan: 'bundlepro2022',
                step: 3,
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
                cycle: 24,
                disablePlanSelection: true,
                plan: 'drive2022',
                step: 3,
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
                cycle: 24,
                disablePlanSelection: true,
                plan: 'pass2023',
                step: 3,
            });
        });
    });
});
