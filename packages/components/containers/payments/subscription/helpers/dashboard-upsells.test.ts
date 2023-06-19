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
    const [base]: Parameters<typeof resolveUpsellsToDisplay> = [
        {
            app: APPS.PROTONMAIL,
            currency: 'EUR',
            subscription,
            plans: plans,
            canPay: true,
            isFree: true,
            hasPaidMail: false,
            openSubscriptionModal: jest.fn(),
        },
    ];

    describe('Free Mail', () => {
        it('should return MailPlus + Unlimited (recommended) upsells', () => {
            expect(resolveUpsellsToDisplay(base)).toMatchObject([
                mailPlusUpsell,
                { ...unlimitedUpsell, isRecommended: true },
            ]);
        });
    });

    describe('Free Trial', () => {
        it('should return MailPlus + Unlimited (recommended) upsells', () => {
            expect(
                resolveUpsellsToDisplay({
                    ...base,
                    subscription: {
                        ...base.subscription,
                        CouponCode: COUPON_CODES.REFERRAL,
                        PeriodEnd: 1718870501,
                    } as Subscription,
                })
            ).toMatchObject([trialMailPlusUpsell, { ...unlimitedUpsell, isRecommended: true }]);
        });
    });

    describe('Mail Plus', () => {
        it('should return Unlimited (recommended) + Family upsells', () => {
            expect(
                resolveUpsellsToDisplay({
                    ...base,
                    isFree: false,
                    hasPaidMail: true,
                })
            ).toMatchObject([
                {
                    ...unlimitedUpsell,
                    isRecommended: true,
                    features: unlimitedUpsell.features.filter(({ text }) => text !== '25 calendars'),
                },
                familyUpsell,
            ]);
        });
    });

    describe('Unlimited', () => {
        it('should return Family upsell', () => {
            expect(
                resolveUpsellsToDisplay({
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
                })
            ).toMatchObject([familyUpsell]);
        });
    });

    describe('Essentials', () => {
        it('should return Business upsell', () => {
            expect(
                resolveUpsellsToDisplay({
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
                })
            ).toMatchObject([businessUpsell]);
        });
    });

    describe('Free Drive', () => {
        it('should return Drive upsell', () => {
            expect(
                resolveUpsellsToDisplay({
                    ...base,
                    app: APPS.PROTONDRIVE,
                    isFree: true,
                })
            ).toMatchObject([drivePlusUpsell]);
        });
    });

    describe('Free Pass', () => {
        it('should return Pass upsell', () => {
            expect(
                resolveUpsellsToDisplay({
                    ...base,
                    app: APPS.PROTONPASS,
                    isFree: true,
                })
            ).toMatchObject([passPlusUpsell]);
        });
    });
});
