import type { ReactNode } from 'react';
import { Route, Router } from 'react-router';

import { renderHook } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { CYCLE, PLANS, PLAN_TYPES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';

import { useAutomaticCurrency } from '../../../../payments/client-extensions/index';
import ConfigProvider from '../../../config/Provider';
import useOfferFlags from '../../hooks/useOfferFlags';
import { useOffer } from './useOffer';
import { useTryDuo2026Discount } from './useTryDuo2026Discount';

jest.mock('@proton/account/user/hooks');
const mockUseUser = useUser as jest.Mock;

jest.mock('@proton/account/subscription/hooks');
const mockUseSubscription = useSubscription as jest.Mock;

jest.mock('../../../../payments/client-extensions/index', () => ({
    __esModule: true,
    useAutomaticCurrency: jest.fn(),
}));
const mockUseAutomaticCurrency = useAutomaticCurrency as jest.Mock;

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as jest.Mock;

jest.mock('../../hooks/useOfferFlags', () => ({
    __esModule: true,
    default: jest.fn(),
}));
const mockUseOfferFlags = useOfferFlags as jest.Mock;

jest.mock('./useTryDuo2026Discount', () => ({
    __esModule: true,
    useTryDuo2026Discount: jest.fn(),
}));
const mockUseTryDuo2026Discount = useTryDuo2026Discount as jest.Mock;

jest.mock('./useUnlimitedToDuoDiscountedTelemetry', () => ({
    __esModule: true,
    useUnlimitedToDuoDiscountedTelemetry: () => {
        return {
            sendReportClickTopNavbar: jest.fn(),
            sendReportClickUpsellButton: jest.fn(),
            sendReportCloseOffer: jest.fn(),
            sendReportClickHideOffer: jest.fn(),
            sendReportUserSubscribed: jest.fn(),
        };
    },
}));

const MAIL_CONFIG = {
    APP_NAME: APPS.PROTONMAIL,
    APP_VERSION: 'test-version',
    DATE_VERSION: 'test-date-version',
} as ProtonConfig;

const history = createMemoryHistory({ initialEntries: ['/'] });

const wrapper = ({ children }: { children: ReactNode }) => {
    return (
        <ConfigProvider config={MAIL_CONFIG}>
            <Router history={history}>
                <Route path="/">{children}</Route>
            </Router>
        </ConfigProvider>
    );
};

/** Day 330 sits inside the 12-month window (305-365). */
const eligibleSubscription = {
    ID: 'subscription-id',
    IsTrial: false,
    External: false,
    Cycle: CYCLE.YEARLY,
    CouponCode: null,
    Plans: [{ Type: PLAN_TYPES.PLAN, Name: PLANS.BUNDLE }],
    UpcomingSubscription: null,
    PeriodStart: Math.floor(Date.now() / 1000) - 330 * 24 * 60 * 60,
    Renew: 1,
} as unknown as Subscription;

describe('unlimitedToDuoDiscounted useOffer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseUser.mockReturnValue([
            { canPay: true, isDelinquent: false, isPaid: true, isFree: false } as UserModel,
            false,
        ]);
        mockUseSubscription.mockReturnValue([eligibleSubscription, false]);
        mockUseAutomaticCurrency.mockReturnValue(['EUR', false]);
        mockUseFlag.mockReturnValue(true);
        mockUseOfferFlags.mockReturnValue({ isHidden: false, loading: false });
        mockUseTryDuo2026Discount.mockReturnValue({ discount: 40, loading: false });
    });

    it('should be valid when the discount has resolved', () => {
        const { result } = renderHook(() => useOffer(), { wrapper });

        expect(result.current.isValid).toBe(true);
        expect(result.current.config?.topButtonDiscount).toBe(40);
    });

    it('should not be valid while the discount is still loading', () => {
        mockUseTryDuo2026Discount.mockReturnValue({ discount: undefined, loading: true });
        const { result } = renderHook(() => useOffer(), { wrapper });

        expect(result.current.isValid).toBe(false);
    });

    it('should not be valid when the price check failed', () => {
        mockUseTryDuo2026Discount.mockReturnValue({ discount: undefined, loading: false });
        const { result } = renderHook(() => useOffer(), { wrapper });

        expect(result.current.isValid).toBe(false);
    });

    it('should not be valid when the coupon resolves to no discount', () => {
        mockUseTryDuo2026Discount.mockReturnValue({ discount: 0, loading: false });
        const { result } = renderHook(() => useOffer(), { wrapper });

        expect(result.current.isValid).toBe(false);
    });

    it('should not be valid when the flag is off', () => {
        mockUseFlag.mockReturnValue(false);
        const { result } = renderHook(() => useOffer(), { wrapper });

        expect(result.current.isValid).toBe(false);
    });

    it('should not be valid when the user has dismissed the offer', () => {
        mockUseOfferFlags.mockReturnValue({ isHidden: true, loading: false });
        const { result } = renderHook(() => useOffer(), { wrapper });

        expect(result.current.isValid).toBe(false);
    });

    it('should not run the price check for an ineligible user', () => {
        mockUseFlag.mockReturnValue(false);
        renderHook(() => useOffer(), { wrapper });

        expect(mockUseTryDuo2026Discount).toHaveBeenCalledWith({ enabled: false });
    });
});
