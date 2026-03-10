import { renderHook } from '@testing-library/react-hooks';

import { CYCLE, PLANS, SubscriptionPlatform } from '@proton/payments';
import type { Subscription } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';

import { useHideBanner } from './SubscriptionEndsBannerHelpers';

jest.mock('@proton/components/hooks/useConfig', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('@proton/components/hooks/useShowVPNDashboard', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('@proton/components/hooks/accounts/useShowDashboard', () => ({
    __esModule: true,
    default: jest.fn(),
    getDashboardFeatureFlag: jest.fn(),
}));

const mockUseConfig = require('@proton/components/hooks/useConfig').default as jest.Mock;
const mockUseShowVPNDashboard = require('@proton/components/hooks/useShowVPNDashboard').default as jest.Mock;
const mockUseShowDashboard = require('@proton/components/hooks/accounts/useShowDashboard').default as jest.Mock;

const defaultSubscription: Subscription = {
    ID: 'sub-123',
    Renew: 0,
    PeriodEnd: 1893456000,
    InvoiceID: '',
    Cycle: CYCLE.MONTHLY,
    PeriodStart: 0,
    CreateTime: 0,
    CouponCode: null,
    Currency: 'USD',
    Amount: 0,
    RenewAmount: 0,
    BaseRenewAmount: 0,
    RenewDiscount: 0,
    Discount: 0,
    Plans: [],
    External: SubscriptionPlatform.Default,
    IsTrial: false,
    RenewCycle: CYCLE.MONTHLY,
};

const subscriptionExpires = {
    subscription: defaultSubscription,
    subscriptionExpiresSoon: true,
    expirationDate: new Date('2026-01-15').getTime() / 1000, // Unix timestamp (seconds), within 30 days of pinned NOW
} as const;

describe('shouldHideBanner', () => {
    beforeEach(() => {
        mockUseConfig.mockReturnValue({ APP_NAME: APPS.PROTONACCOUNT });
        mockUseShowVPNDashboard.mockReturnValue({ showVPNDashboard: false });
        mockUseShowDashboard.mockReturnValue({ showDashboard: false });
    });

    describe('app guard', () => {
        it('returns true when APP_NAME is not proton-account or vpn settings', () => {
            mockUseConfig.mockReturnValue({ APP_NAME: APPS.PROTONMAIL });
            const { result } = renderHook(() =>
                useHideBanner(
                    APPS.PROTONMAIL,
                    subscriptionExpires.subscription,
                    subscriptionExpires.subscriptionExpiresSoon,
                    subscriptionExpires.expirationDate
                )
            );
            expect(result.current).toBe(true);
        });

        it('returns false for PROTONACCOUNT', () => {
            const { result } = renderHook(() =>
                useHideBanner(
                    APPS.PROTONACCOUNT,
                    subscriptionExpires.subscription,
                    subscriptionExpires.subscriptionExpiresSoon,
                    subscriptionExpires.expirationDate
                )
            );
            expect(result.current).toBe(false);
        });

        it('returns false for PROTONVPN_SETTINGS', () => {
            mockUseConfig.mockReturnValue({ APP_NAME: APPS.PROTONVPN_SETTINGS });
            const { result } = renderHook(() =>
                useHideBanner(
                    APPS.PROTONVPN_SETTINGS,
                    subscriptionExpires.subscription,
                    subscriptionExpires.subscriptionExpiresSoon,
                    subscriptionExpires.expirationDate
                )
            );
            expect(result.current).toBe(false);
        });
    });

    describe('dashboard guard', () => {
        it('returns true when showVPNDashboard is true', () => {
            mockUseShowVPNDashboard.mockReturnValue({ showVPNDashboard: true });
            const { result } = renderHook(() =>
                useHideBanner(
                    APPS.PROTONACCOUNT,
                    subscriptionExpires.subscription,
                    subscriptionExpires.subscriptionExpiresSoon,
                    subscriptionExpires.expirationDate
                )
            );
            expect(result.current).toBe(true);
        });

        it('returns true when showDashboard is true', () => {
            mockUseShowDashboard.mockReturnValue({ showDashboard: true });
            const { result } = renderHook(() =>
                useHideBanner(
                    APPS.PROTONACCOUNT,
                    subscriptionExpires.subscription,
                    subscriptionExpires.subscriptionExpiresSoon,
                    subscriptionExpires.expirationDate
                )
            );
            expect(result.current).toBe(true);
        });
    });

    describe('trial guard', () => {
        it('returns true when subscription is a trial', () => {
            const trialSubscription: Subscription = { ...defaultSubscription, IsTrial: true };
            const { result } = renderHook(() =>
                useHideBanner(
                    APPS.PROTONACCOUNT,
                    trialSubscription,
                    subscriptionExpires.subscriptionExpiresSoon,
                    subscriptionExpires.expirationDate
                )
            );
            expect(result.current).toBe(true);
        });
    });

    describe('subscription / expiration guard', () => {
        it('returns true when subscriptionExpiresSoon is false', () => {
            const { result } = renderHook(() =>
                useHideBanner(
                    APPS.PROTONACCOUNT,
                    subscriptionExpires.subscription,
                    false,
                    subscriptionExpires.expirationDate
                )
            );
            expect(result.current).toBe(true);
        });

        it('returns true when expirationDate is null', () => {
            const { result } = renderHook(() =>
                useHideBanner(
                    APPS.PROTONACCOUNT,
                    subscriptionExpires.subscription,
                    subscriptionExpires.subscriptionExpiresSoon,
                    null
                )
            );
            expect(result.current).toBe(true);
        });
    });

    describe('shouldHideBannerForDistantExpiration (via shouldHideBanner)', () => {
        const NOW = new Date('2026-01-01');
        // 120 days ahead: threshold = 120 - 30 = 90 days → still in future → hide
        const FAR_FUTURE_MS = new Date('2026-05-01').getTime() / 1000;
        // 15 days ahead: threshold = 15 - 30 = -15 days → in the past → show
        const NEAR_MS = new Date('2026-01-15').getTime() / 1000;

        beforeAll(() => jest.useFakeTimers().setSystemTime(NOW));
        afterAll(() => jest.useRealTimers());

        it('returns true (hides) for mailpro2022 plan when expiration is more than 30 days away', () => {
            const sub: Subscription = { ...defaultSubscription, Plans: [{ Name: PLANS.MAIL_PRO } as any] };
            const { result } = renderHook(() =>
                useHideBanner(APPS.PROTONACCOUNT, sub, subscriptionExpires.subscriptionExpiresSoon, FAR_FUTURE_MS)
            );
            expect(result.current).toBe(true);
        });

        it('returns false (shows) for mailpro2022 plan when expiration is within 30 days', () => {
            const sub: Subscription = { ...defaultSubscription, Plans: [{ Name: PLANS.MAIL_PRO } as any] };
            const { result } = renderHook(() =>
                useHideBanner(APPS.PROTONACCOUNT, sub, subscriptionExpires.subscriptionExpiresSoon, NEAR_MS)
            );
            expect(result.current).toBe(false);
        });

        it('returns false (shows) for non-targeted plan even when expiration is more than 30 days away', () => {
            const sub: Subscription = { ...defaultSubscription, Plans: [{ Name: PLANS.BUNDLE } as any] };
            const { result } = renderHook(() =>
                useHideBanner(APPS.PROTONACCOUNT, sub, subscriptionExpires.subscriptionExpiresSoon, FAR_FUTURE_MS)
            );
            expect(result.current).toBe(false);
        });
    });

    it('returns false when all conditions pass', () => {
        const { result } = renderHook(() =>
            useHideBanner(
                APPS.PROTONACCOUNT,
                subscriptionExpires.subscription,
                subscriptionExpires.subscriptionExpiresSoon,
                subscriptionExpires.expirationDate
            )
        );
        expect(result.current).toBe(false);
    });
});
