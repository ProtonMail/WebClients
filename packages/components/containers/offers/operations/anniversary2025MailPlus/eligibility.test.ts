import { addDays, getUnixTime } from 'date-fns';

import type { FeatureCode } from '@proton/features';
import { type Subscription, type SubscriptionPlan } from '@proton/payments';
import { CYCLE, PLANS } from '@proton/payments';
import { PLAN_TYPES } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { type ProtonConfig, type UserModel } from '@proton/shared/lib/interfaces';

import { FREE_DOWNGRADER_LIMIT } from '../../helpers/offerPeriods';
import { type Deal, type OfferConfig } from '../../interface';
import { getIsEligible } from './eligibility';

const mockGetAppFromPathnameSafe = jest.fn();

jest.mock('@proton/shared/lib/apps/slugHelper', () => ({
    getAppFromPathnameSafe: () => mockGetAppFromPathnameSafe(),
}));

describe('Proton Anniversary 2025 - Mail Plus offer eligibility', () => {
    const mockUser: Partial<UserModel> = {
        isPaid: false,
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
        Cycle: CYCLE.MONTHLY,
        Amount: 499,
    };

    const mockSubscription: Partial<Subscription> = {
        Plans: [mockSubscriptionPlan as SubscriptionPlan],
        PeriodEnd: 1234567890,
        ID: 'test-sub-id',
        InvoiceID: 'test-invoice',
        Cycle: 1,
        PeriodStart: 1234567890,
    };

    const mockDeal: Partial<Deal> = {
        cycle: CYCLE.YEARLY,
        planIDs: {
            [PLANS.MAIL]: 1,
        },
    };

    const mockOfferConfig: Partial<OfferConfig> = {
        ID: 'anniversary-2025-mail-plus',
        featureCode: 'OfferAnniversary2025' as FeatureCode,
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
    });

    it('should exclude free accounts that recently downgraded', () => {
        const recentDowngradeTime = getUnixTime(addDays(FREE_DOWNGRADER_LIMIT, 1));
        const result = getIsEligible({
            user: mockUser as UserModel,
            protonConfig: mockProtonConfig as ProtonConfig,
            previousSubscriptionEndTime: recentDowngradeTime,
            subscription: mockSubscription as Subscription,
            offerConfig: mockOfferConfig as OfferConfig,
        });

        expect(result).toBe(false);
    });

    it('should target Mail Plus 1 month accounts', () => {
        const paidUser = {
            ...mockUser,
            isPaid: true,
        };

        const monthlyMailSubscription = {
            ...mockSubscription,
            Plans: [
                {
                    ...mockSubscriptionPlan,
                    Name: PLANS.MAIL,
                    Cycle: CYCLE.MONTHLY,
                } as SubscriptionPlan,
            ],
            PeriodEnd: 1234567890,
        };

        const result = getIsEligible({
            user: paidUser as UserModel,
            protonConfig: mockProtonConfig as ProtonConfig,
            previousSubscriptionEndTime: 0,
            subscription: monthlyMailSubscription as Subscription,
            offerConfig: mockOfferConfig as OfferConfig,
        });

        expect(result).toBe(true);
    });

    it('should target Inbox applications: Mail and Calendar', () => {
        const testCases = [
            { appName: APPS.PROTONMAIL, pathname: '/mail', parentApp: APPS.PROTONMAIL },
            { appName: APPS.PROTONCALENDAR, pathname: '/calendar', parentApp: APPS.PROTONCALENDAR },
            { appName: APPS.PROTONACCOUNT, pathname: '/mail', parentApp: APPS.PROTONMAIL },
            { appName: APPS.PROTONACCOUNT, pathname: '/calendar', parentApp: APPS.PROTONCALENDAR },
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
                previousSubscriptionEndTime: 0,
                subscription: mockSubscription as Subscription,
                offerConfig: mockOfferConfig as OfferConfig,
            });

            expect(result).toBe(true);
        });
    });

    it('should not be eligible for delinquent users', () => {
        const delinquentUser = {
            ...mockUser,
            isDelinquent: true,
        };

        const result = getIsEligible({
            user: delinquentUser as UserModel,
            protonConfig: mockProtonConfig as ProtonConfig,
            previousSubscriptionEndTime: 0,
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
            previousSubscriptionEndTime: 0,
            subscription: mockSubscription as Subscription,
            offerConfig: mockOfferConfig as OfferConfig,
        });

        expect(result).toBe(false);
    });
});
