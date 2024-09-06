import { renderHook } from '@testing-library/react-hooks';
import { addMonths } from 'date-fns';

import type { CheckSubscriptionData } from '@proton/shared/lib/api/payments';
import { APPS, PLANS } from '@proton/shared/lib/constants';
import type { SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';
import {
    addApiMock,
    apiMock,
    defaultProtonConfig,
    hookWrapper,
    withApi,
    withConfig,
    withPaymentContext,
} from '@proton/testing';

import { useChargebeeKillSwitch } from '../client-extensions/useChargebeeKillSwitch';
import { usePaymentsApi } from './usePaymentsApi';

const mockUseChargebeeKillSwitch = useChargebeeKillSwitch as jest.Mock;
jest.mock('../client-extensions/useChargebeeKillSwitch', () => ({
    __esModule: true,
    useChargebeeKillSwitch: jest.fn().mockReturnValue({ chargebeeKillSwitch: jest.fn().mockReturnValue(true) }),
}));

jest.mock('@proton/components/hooks/usePlans', () => ({
    __esModule: true,
    useGetPlans: jest.fn(),
}));

const getWrapper = (chargebeeEnabled?: ChargebeeEnabled) =>
    hookWrapper(withApi(), withConfig(), withPaymentContext(chargebeeEnabled));

beforeEach(() => {
    jest.clearAllMocks();

    addApiMock('payments/v5/status', () => ({
        Code: 1000,
        CountryCode: 'CH',
        State: null,
        VendorStates: {
            Apple: 1,
            Bitcoin: 1,
            Card: 1,
            InApp: 0,
            Paypal: 1,
        },
    }));
    addApiMock('payments/v4/status', () => ({
        Apple: 1,
        Bitcoin: 1,
        Card: 1,
        InApp: 0,
        Paypal: 1,
    }));
});

describe('usePaymentsApi', () => {
    it('returns an object with paymentsApi and getPaymentsApi properties', () => {
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(),
        });
        expect(result.current).toHaveProperty('paymentsApi');
        expect(result.current).toHaveProperty('getPaymentsApi');
    });

    it('should call v4 status when user is inhouse forced', () => {
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(ChargebeeEnabled.INHOUSE_FORCED),
        });

        void result.current.paymentsApi.statusExtendedAutomatic();
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v4/status`,
            method: 'get',
        });
    });

    it('should call v5 status when user is chargebee forced', () => {
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(ChargebeeEnabled.CHARGEBEE_FORCED),
        });

        void result.current.paymentsApi.statusExtendedAutomatic();
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/status`,
            method: 'get',
        });
    });

    it('should call v5 status when user is chargebee allowed', () => {
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(ChargebeeEnabled.CHARGEBEE_ALLOWED),
        });

        void result.current.paymentsApi.statusExtendedAutomatic();
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/status`,
            method: 'get',
        });
    });

    it('should not call v4 if kill switch was not triggered and returned false', async () => {
        apiMock.mockRejectedValueOnce(new Error('status call failed in the unit test'));
        mockUseChargebeeKillSwitch.mockReturnValue({ chargebeeKillSwitch: jest.fn().mockReturnValue(false) });
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(ChargebeeEnabled.CHARGEBEE_ALLOWED),
        });

        await expect(result.current.paymentsApi.statusExtendedAutomatic()).rejects.toThrow(
            'status call failed in the unit test'
        );
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/status`,
            method: 'get',
        });
        const wasV4Called = apiMock.mock.calls.some(
            (call) => call[0].url.includes('payments/v4/status') && call[0].method === 'get'
        );
        expect(wasV4Called).toBe(false);
        // not relevant after kill switch is removed
        // expect(mockUseChargebeeKillSwitch).toHaveBeenCalled();
    });

    const getCheckSubscriptionData = (): CheckSubscriptionData => {
        const data: CheckSubscriptionData = {
            Plans: {
                [PLANS.BUNDLE]: 1,
            },
            Currency: 'EUR',
            Cycle: 12,
        };

        return data;
    };

    // tests for checkWithAutomaticVersion
    it('should call v4 check when user is inhouse forced', () => {
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(ChargebeeEnabled.INHOUSE_FORCED),
        });

        const data = getCheckSubscriptionData();
        void result.current.paymentsApi.checkWithAutomaticVersion(data);
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v4/subscription/check`,
            method: 'post',
            data,
        });
    });

    it('should call v5 check when user is chargebee forced', () => {
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(ChargebeeEnabled.CHARGEBEE_FORCED),
        });

        const data = getCheckSubscriptionData();
        void result.current.paymentsApi.checkWithAutomaticVersion(data);
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/subscription/check`,
            method: 'post',
            data,
            silence: false,
        });
    });

    it('should call v5 check when user is chargebee allowed', () => {
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(ChargebeeEnabled.CHARGEBEE_ALLOWED),
        });

        const data = getCheckSubscriptionData();
        void result.current.paymentsApi.checkWithAutomaticVersion(data);
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/subscription/check`,
            method: 'post',
            data,
            silence: false,
        });
    });

    it('should not call v4 if kill switch was not triggered and returned false', async () => {
        apiMock.mockRejectedValueOnce(new Error('check call failed in the unit test'));
        mockUseChargebeeKillSwitch.mockReturnValue({ chargebeeKillSwitch: jest.fn().mockReturnValue(false) });
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(ChargebeeEnabled.CHARGEBEE_ALLOWED),
        });

        const data = getCheckSubscriptionData();
        await expect(result.current.paymentsApi.checkWithAutomaticVersion(data)).rejects.toThrow(
            'check call failed in the unit test'
        );
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/subscription/check`,
            method: 'post',
            data,
            silence: false,
        });
        const wasV4Called = apiMock.mock.calls.some(
            (call) => call[0].url.includes('payments/v4/subscription/check') && call[0].method === 'post'
        );
        expect(wasV4Called).toBe(false);
        // not relevant after kill switch is removed
        // expect(mockUseChargebeeKillSwitch).toHaveBeenCalled();
    });

    it('should return fallback value if it is available and if v5 check fails', async () => {
        apiMock.mockRejectedValueOnce(new Error('check call failed in the unit test'));
        mockUseChargebeeKillSwitch.mockReturnValue({ chargebeeKillSwitch: jest.fn().mockReturnValue(false) });

        const fallbackValue: SubscriptionCheckResponse = {
            Amount: 999,
            AmountDue: 999,
            Coupon: null,
            Currency: 'EUR',
            Cycle: 12,
            PeriodEnd: +addMonths(Date.now(), 1) / 1000,
        };

        const { result } = renderHook(() => usePaymentsApi(undefined, () => fallbackValue), {
            wrapper: getWrapper(ChargebeeEnabled.CHARGEBEE_ALLOWED),
        });

        const data = getCheckSubscriptionData();
        const resultPromise = result.current.paymentsApi.checkWithAutomaticVersion(data);

        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/subscription/check`,
            method: 'post',
            data,
            // silence is true because we are using fallback value
            silence: true,
        });

        const wasV4Called = apiMock.mock.calls.some(
            (call) => call[0].url.includes('payments/v4/subscription/check') && call[0].method === 'post'
        );
        expect(wasV4Called).toBe(false);

        await expect(resultPromise).resolves.toEqual(fallbackValue);
    });

    it.each([PLANS.PASS_PRO, PLANS.PASS_BUSINESS])(
        'should call v4 check when user is chargebee allowed calls B2B plans: %s',
        (plan) => {
            const { result } = renderHook(() => usePaymentsApi(), {
                wrapper: getWrapper(ChargebeeEnabled.CHARGEBEE_ALLOWED),
            });

            const data = getCheckSubscriptionData();
            data.Plans = {
                [plan]: 1,
            };

            void result.current.paymentsApi.checkWithAutomaticVersion(data);
            expect(apiMock).toHaveBeenCalledWith({
                url: `payments/v4/subscription/check`,
                method: 'post',
                data,
            });
        }
    );

    it.each([
        {
            appName: APPS.PROTONACCOUNTLITE,
            expectedCashValue: false,
        },
        {
            appName: APPS.PROTONACCOUNT,
            expectedCashValue: true,
        },
    ])('should switch Cash to $expectedCashValue when it is $appName', async ({ appName, expectedCashValue }) => {
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: hookWrapper(
                withApi(),
                withConfig({
                    ...defaultProtonConfig,
                    APP_NAME: appName,
                }),
                withPaymentContext(ChargebeeEnabled.CHARGEBEE_ALLOWED)
            ),
        });

        const status = await result.current.paymentsApi.statusExtendedAutomatic();

        expect(status.VendorStates.Cash).toEqual(expectedCashValue);
    });
});
