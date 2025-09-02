import type { FeatureCode } from '@proton/features';
import type { Subscription, SubscriptionPlan } from '@proton/payments';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments';
import { PLAN_TYPES } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import type { Deal, OfferConfig } from '../../interface';
import { getIsEligible } from './eligibility';

const mockGetAppFromPathnameSafe = jest.fn();

jest.mock('@proton/shared/lib/apps/slugHelper', () => ({
    getAppFromPathnameSafe: () => mockGetAppFromPathnameSafe(),
}));

describe('Proton Anniversary 2025 - Unlimited offer eligibility', () => {
    const mockUser: Partial<UserModel> = {
        isPaid: true,
        canPay: true,
        isDelinquent: false,
        ID: 'test-user-id',
        Name: 'Test User',
        UsedSpace: 0,
        UsedBaseSpace: 0,
    };

    const mockProtonConfig: Partial<ProtonConfig> = {
        APP_NAME: APPS.PROTONMAIL,
        CLIENT_TYPE: 1,
        CLIENT_SECRET: 'test-secret',
        APP_VERSION: '1.0.0',
        API_URL: 'https://test.api',
    };

    const mockSubscriptionPlan: Partial<SubscriptionPlan> = {
        Name: PLANS.MAIL,
        ID: 'test-plan-id',
        Currency: 'CHF',
        MaxSpace: 16106127360,
        Type: PLAN_TYPES.PLAN,
        MaxDomains: 1,
        MaxAddresses: 10,
        MaxCalendars: 25,
        MaxMembers: 1,
        MaxVPN: 0,
        MaxTier: 0,
        Services: 1,
        Features: 1,
        State: 1,
        Quantity: 1,
        Cycle: CYCLE.YEARLY,
        Amount: 499,
    };

    const mockSubscription: Partial<Subscription> = {
        Plans: [mockSubscriptionPlan as SubscriptionPlan],
        PeriodEnd: 1234567890,
        ID: 'test-sub-id',
        InvoiceID: 'test-invoice',
        Cycle: CYCLE.YEARLY,
        PeriodStart: 1234567890,
    };

    const mockDeal: Partial<Deal> = {
        cycle: CYCLE.YEARLY,
        planIDs: {
            [PLANS.BUNDLE]: 1,
        },
    };

    const mockOfferConfig: Partial<OfferConfig> = {
        ID: 'anniversary-2025-bundle',
        featureCode: 'OfferAnniversary2025Bundle' as FeatureCode,
        deals: [mockDeal as Deal],
        layout: undefined,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock window.location
        Object.defineProperty(window, 'location', {
            value: { pathname: '/mail' },
            writable: true,
        });
        mockGetAppFromPathnameSafe.mockReturnValue(APPS.PROTONMAIL);
    });

    it('should be eligible for yearly Mail Plus users', () => {
        const yearlyMailSubscription = {
            ...mockSubscription,
            Plans: [
                {
                    ...mockSubscriptionPlan,
                    Name: PLANS.MAIL,
                    Cycle: CYCLE.YEARLY,
                } as SubscriptionPlan,
            ],
        };

        const result = getIsEligible({
            user: mockUser as UserModel,
            protonConfig: mockProtonConfig as ProtonConfig,
            subscription: yearlyMailSubscription as Subscription,
            offerConfig: mockOfferConfig as OfferConfig,
        });

        expect(result).toBe(true);
    });

    it('should be eligible for yearly Pass Plus users', () => {
        const yearlyPassSubscription = {
            ...mockSubscription,
            Plans: [
                {
                    ...mockSubscriptionPlan,
                    Name: PLANS.PASS,
                    Cycle: CYCLE.YEARLY,
                } as SubscriptionPlan,
            ],
        };

        const result = getIsEligible({
            user: mockUser as UserModel,
            protonConfig: mockProtonConfig as ProtonConfig,
            subscription: yearlyPassSubscription as Subscription,
            offerConfig: mockOfferConfig as OfferConfig,
        });

        expect(result).toBe(true);
    });

    it('should be eligible for yearly VPN Plus users', () => {
        const yearlyVPNSubscription = {
            ...mockSubscription,
            Plans: [
                {
                    ...mockSubscriptionPlan,
                    Name: PLANS.VPN2024,
                    Cycle: CYCLE.YEARLY,
                } as SubscriptionPlan,
            ],
        };

        const result = getIsEligible({
            user: mockUser as UserModel,
            protonConfig: mockProtonConfig as ProtonConfig,
            subscription: yearlyVPNSubscription as Subscription,
            offerConfig: mockOfferConfig as OfferConfig,
        });

        expect(result).toBe(true);
    });

    it('should be eligible for Drive Plus users regardless of cycle', () => {
        const monthlyDriveSubscription = {
            ...mockSubscription,
            Plans: [
                {
                    ...mockSubscriptionPlan,
                    Name: PLANS.DRIVE,
                    Cycle: CYCLE.MONTHLY,
                } as SubscriptionPlan,
            ],
        };

        const result = getIsEligible({
            user: mockUser as UserModel,
            protonConfig: mockProtonConfig as ProtonConfig,
            subscription: monthlyDriveSubscription as Subscription,
            offerConfig: mockOfferConfig as OfferConfig,
        });

        expect(result).toBe(true);
    });

    it('should not be eligible for monthly Mail Plus users', () => {
        const monthlyMailSubscription = {
            ...mockSubscription,
            Cycle: CYCLE.MONTHLY,
            Plans: [
                {
                    ...mockSubscriptionPlan,
                    Name: PLANS.MAIL,
                    Cycle: CYCLE.MONTHLY,
                } as SubscriptionPlan,
            ],
        };

        const result = getIsEligible({
            user: mockUser as UserModel,
            protonConfig: mockProtonConfig as ProtonConfig,
            subscription: monthlyMailSubscription as Subscription,
            offerConfig: mockOfferConfig as OfferConfig,
        });

        expect(result).toBe(false);
    });

    it('should not be eligible for users with Anniversary 2025 coupon', () => {
        const subscriptionWithCoupon = {
            ...mockSubscription,
            CouponCode: COUPON_CODES.COMMUNITYSPECIALDEAL25,
        };

        const result = getIsEligible({
            user: mockUser as UserModel,
            protonConfig: mockProtonConfig as ProtonConfig,
            subscription: subscriptionWithCoupon as Subscription,
            offerConfig: mockOfferConfig as OfferConfig,
        });

        expect(result).toBe(false);
    });

    it('should not be eligible for externally managed subscriptions', () => {
        const externalSubscription = {
            ...mockSubscription,
            External: 1, // Using 1 instead of true for External type
        };

        const result = getIsEligible({
            user: mockUser as UserModel,
            protonConfig: mockProtonConfig as ProtonConfig,
            subscription: externalSubscription as Subscription,
            offerConfig: mockOfferConfig as OfferConfig,
        });

        expect(result).toBe(false);
    });

    it('should not be eligible for delinquent users', () => {
        const delinquentUser = {
            ...mockUser,
            isDelinquent: true,
        };

        const result = getIsEligible({
            user: delinquentUser as UserModel,
            protonConfig: mockProtonConfig as ProtonConfig,
            subscription: mockSubscription as Subscription,
            offerConfig: mockOfferConfig as OfferConfig,
        });

        expect(result).toBe(false);
    });

    it('should not be eligible for users who cannot pay', () => {
        const nonPayingUser = {
            ...mockUser,
            canPay: false,
        };

        const result = getIsEligible({
            user: nonPayingUser as UserModel,
            protonConfig: mockProtonConfig as ProtonConfig,
            subscription: mockSubscription as Subscription,
            offerConfig: mockOfferConfig as OfferConfig,
        });

        expect(result).toBe(false);
    });

    it('should target valid standalone applications', () => {
        const testCases = [
            { appName: APPS.PROTONMAIL, pathname: '/mail', parentApp: APPS.PROTONMAIL },
            { appName: APPS.PROTONCALENDAR, pathname: '/calendar', parentApp: APPS.PROTONCALENDAR },
            { appName: APPS.PROTONDRIVE, pathname: '/drive', parentApp: APPS.PROTONDRIVE },
            { appName: APPS.PROTONVPN_SETTINGS, pathname: '/vpn', parentApp: APPS.PROTONVPN_SETTINGS },
            { appName: APPS.PROTONPASS, pathname: '/pass', parentApp: APPS.PROTONPASS },
            { appName: APPS.PROTONACCOUNT, pathname: '/mail', parentApp: APPS.PROTONMAIL },
            { appName: APPS.PROTONACCOUNT, pathname: '/calendar', parentApp: APPS.PROTONCALENDAR },
            { appName: APPS.PROTONACCOUNT, pathname: '/drive', parentApp: APPS.PROTONDRIVE },
            { appName: APPS.PROTONACCOUNT, pathname: '/vpn', parentApp: APPS.PROTONVPN_SETTINGS },
            { appName: APPS.PROTONACCOUNT, pathname: '/pass', parentApp: APPS.PROTONPASS },
        ];

        testCases.forEach(({ appName, pathname, parentApp }) => {
            Object.defineProperty(window, 'location', {
                value: { pathname },
                writable: true,
            });
            mockGetAppFromPathnameSafe.mockReturnValue(parentApp);

            const result = getIsEligible({
                user: mockUser as UserModel,
                protonConfig: { ...mockProtonConfig, APP_NAME: appName } as ProtonConfig,
                subscription: mockSubscription as Subscription,
                offerConfig: mockOfferConfig as OfferConfig,
            });

            expect(result).toBe(true);
        });
    });
});
