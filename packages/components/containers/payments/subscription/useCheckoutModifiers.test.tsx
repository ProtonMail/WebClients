import { renderHook } from '@testing-library/react-hooks';

import { DEFAULT_TAX_BILLING_ADDRESS } from '@proton/payments';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/shared/lib/constants';
import type { PlansMap, SubscriptionCheckResponse, SubscriptionModel } from '@proton/shared/lib/interfaces';
import { Renew } from '@proton/shared/lib/interfaces';

import type { Model } from './SubscriptionContainer';
import { SUBSCRIPTION_STEPS } from './constants';
import { useCheckoutModifiers } from './useCheckoutModifiers';

describe('useCheckoutModifiers', () => {
    let model: Model;
    let subscriptionModel: SubscriptionModel;
    let checkResult: SubscriptionCheckResponse;
    const plansMap: PlansMap = {
        mail2022: {
            ID: 'Wb4NAqmiuqoA7kCHE28y92bBFfN8jaYQCLxHRAB96yGj-bh9SxguXC48_WSU-fRUjdAr-lx95c6rFLplgXyXYA==',
            ParentMetaPlanID: '',
            Type: 1,
            Name: PLANS.MAIL,
            Title: 'Mail Plus',
            MaxDomains: 1,
            MaxAddresses: 10,
            MaxCalendars: 25,
            MaxSpace: 16106127360,
            MaxMembers: 1,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 1,
            Features: 1,
            State: 1,
            Pricing: {
                '1': 499,
                '12': 4788,
                '24': 8376,
            },
            PeriodEnd: {
                '1': 1702849536,
                '12': 1731879936,
                '24': 1763415936,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 499,
            Offers: [],
        },
        mailpro2022: {
            ID: 'rIJcBetavQi7h5qqN9nxrRnlojgl6HF6bAVG989deNJVVVx1nn2Ic3eyCVV2Adq11ddseZuWba9H5tmvLC727Q==',
            ParentMetaPlanID: '',
            Type: 1,
            Name: PLANS.MAIL_PRO,
            Title: 'Mail Essentials',
            MaxDomains: 3,
            MaxAddresses: 10,
            MaxCalendars: 25,
            MaxSpace: 16106127360,
            MaxMembers: 1,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 1,
            Features: 1,
            State: 1,
            Pricing: {
                '1': 799,
                '12': 8388,
                '24': 15576,
            },
            PeriodEnd: {
                '1': 1702849536,
                '12': 1731879936,
                '24': 1763415936,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 799,
            Offers: [],
        },
        bundle2022: {
            ID: 'vl-JevUsz3GJc18CC1VOs-qDKqoIWlLiUePdrzFc72-BtxBPHBDZM7ayn8CNQ59Sk4XjDbwwBVpdYrPIFtOvIw==',
            ParentMetaPlanID: '',
            Type: 1,
            Name: PLANS.BUNDLE,
            Title: 'Proton Unlimited',
            MaxDomains: 3,
            MaxAddresses: 15,
            MaxCalendars: 25,
            MaxSpace: 536870912000,
            MaxMembers: 1,
            MaxVPN: 10,
            MaxTier: 2,
            Services: 7,
            Features: 1,
            State: 1,
            Pricing: {
                '1': 1199,
                '12': 11988,
                '24': 19176,
            },
            PeriodEnd: {
                '1': 1702849536,
                '12': 1731879936,
                '24': 1763415936,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 1199,
            Offers: [],
        },
    };

    beforeEach(() => {
        model = {
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            currency: 'CHF',
            cycle: CYCLE.MONTHLY,
            initialCheckComplete: false,
            taxBillingAddress: DEFAULT_TAX_BILLING_ADDRESS,
            noPaymentNeeded: false,
        };

        subscriptionModel = {
            ID: 'id123',
            InvoiceID: 'id456',
            Cycle: CYCLE.MONTHLY,
            PeriodStart: Math.floor(Date.now() / 1000) - 1,
            PeriodEnd: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60),
            CreateTime: Math.floor(Date.now() / 1000) - 1,
            CouponCode: null,
            Currency: 'CHF',
            Amount: 499,
            RenewAmount: 499,
            Discount: 0,
            RenewDiscount: 0,
            isManagedByMozilla: false,
            External: 0,
            Renew: Renew.Enabled,
            Plans: [
                {
                    Amount: 499,
                    Currency: 'CHF',
                    Cycle: 1,
                    Features: 1,
                    ID: 'Wb4NAqmiuqoA7kCHE28y92bBFfN8jaYQCLxHRAB96yGj-bh9SxguXC48_WSU-fRUjdAr-lx95c6rFLplgXyXYA==',
                    MaxAddresses: 10,
                    MaxCalendars: 25,
                    MaxDomains: 1,
                    MaxMembers: 1,
                    MaxSpace: 16106127360,
                    MaxTier: 0,
                    MaxVPN: 0,
                    Name: PLANS.MAIL,
                    Quantity: 1,
                    Services: 1,
                    State: 1,
                    Title: 'Mail Plus',
                    Type: 1,
                    Offer: 'default',
                },
            ],
        };

        checkResult = {
            Amount: 499,
            AmountDue: 499,
            Coupon: null,
            Currency: 'CHF',
            Cycle: CYCLE.MONTHLY,
            PeriodEnd: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60),
        };
    });

    it('should return isProration === true when checkResult is undefined', () => {
        const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
        expect(result.current.isProration).toEqual(true);
    });

    it('should return isProration === true when user buys different plan', () => {
        model.planIDs = {
            [PLANS.MAIL_PRO]: 1,
        };

        subscriptionModel.Plans[0].Name = PLANS.MAIL;

        const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
        expect(result.current.isProration).toEqual(true);
    });

    it('should return isProration === true if user buys the same plan but proration is undefined', () => {
        checkResult.Proration = undefined;
        const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
        expect(result.current.isProration).toEqual(true);
    });

    it('should return isProration === true if Proration exists and proration !== 0', () => {
        checkResult.Proration = -450;
        const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
        expect(result.current.isProration).toEqual(true);
    });

    it('should return isProration === false if Proration exists and proration === 0', () => {
        checkResult.Proration = 0;
        const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
        expect(result.current.isProration).toEqual(false);
    });

    it('should return isScheduledSubscription === false if checkResult is undefined', () => {
        const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
        expect(result.current.isScheduledSubscription).toEqual(false);
    });

    it('should return isProration true when user has trial', () => {
        subscriptionModel.CouponCode = COUPON_CODES.REFERRAL;
        checkResult.Proration = 0;
        const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
        expect(result.current.isProration).toEqual(true);
    });

    describe('custom billings', () => {
        it('should return isScheduledSubscription === false if UnusedCredit !== 0', () => {
            checkResult.Proration = 0;
            checkResult.UnusedCredit = -20;
            const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
            expect(result.current.isScheduledSubscription).toEqual(false);
        });

        it('should return isProration === false if UnusedCredit !== 0', () => {
            checkResult.Proration = 0;
            checkResult.UnusedCredit = -20;
            const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
            expect(result.current.isProration).toEqual(false);
        });

        it('should return isCustomBilling === true if UnusedCredit !== 0', () => {
            checkResult.Proration = 0;
            checkResult.UnusedCredit = -20;
            const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
            expect(result.current.isCustomBilling).toEqual(true);
        });

        it('should return isCustomBilling === false if UnusedCredit === 0', () => {
            checkResult.Proration = 150;
            checkResult.UnusedCredit = 0;
            const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
            expect(result.current.isCustomBilling).toEqual(false);
        });

        it('should return isCustomBilling === false if UnusedCredit === 0 if Proration is 0 too', () => {
            checkResult.Proration = 0;
            checkResult.UnusedCredit = 0;
            const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
            expect(result.current.isCustomBilling).toEqual(false);
        });

        it('should return isCustomBilling === false if checkResult is undefined', () => {
            const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
            expect(result.current.isCustomBilling).toEqual(false);
        });

        it('should return isCustomBilling === false if UnusedCredit is undefined', () => {
            checkResult.Proration = 0;
            checkResult.UnusedCredit = undefined;
            const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
            expect(result.current.isCustomBilling).toEqual(false);
        });
    });

    it('should set all checkout modifiers to false if check result is optimistic', () => {
        checkResult.optimistic = true;
        const { result } = renderHook(() => useCheckoutModifiers(model, subscriptionModel, plansMap, checkResult));
        expect(result.current.isProration).toEqual(false);
        expect(result.current.isScheduledSubscription).toEqual(false);
        expect(result.current.isCustomBilling).toEqual(false);
        expect(result.current.isAddonDowngrade).toEqual(false);
    });
});
