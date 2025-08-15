import { renderHook } from '@testing-library/react-hooks';

import { type CheckSubscriptionData, PLANS } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';
import {
    addApiMock,
    apiMock,
    defaultProtonConfig,
    hookWrapper,
    withApi,
    withConfig,
    withPaymentSwitcherContext,
} from '@proton/testing';

import { usePaymentsApi } from './usePaymentsApi';

jest.mock('@proton/account/plans/hooks', () => ({
    __esModule: true,
    useGetPlans: jest.fn(),
}));

const getWrapper = (chargebeeEnabled?: ChargebeeEnabled) =>
    hookWrapper(withApi(), withConfig(), withPaymentSwitcherContext(chargebeeEnabled));

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
});

describe('usePaymentsApi', () => {
    it('returns an object with paymentsApi and getPaymentsApi properties', () => {
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(),
        });
        expect(result.current).toHaveProperty('paymentsApi');
        expect(result.current).toHaveProperty('getPaymentsApi');
    });

    it('should call v5 status when user is chargebee forced', () => {
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(ChargebeeEnabled.CHARGEBEE_FORCED),
        });

        void result.current.paymentsApi.paymentStatus();
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/status`,
            method: 'get',
        });
    });

    it('should call v5 status when user is chargebee allowed', () => {
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(ChargebeeEnabled.CHARGEBEE_ALLOWED),
        });

        void result.current.paymentsApi.paymentStatus();
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/status`,
            method: 'get',
        });
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

    it('should call v5 check when user is chargebee forced', () => {
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(ChargebeeEnabled.CHARGEBEE_FORCED),
        });

        const data = getCheckSubscriptionData();
        void result.current.paymentsApi.checkSubscription(data);
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
        void result.current.paymentsApi.checkSubscription(data);
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/subscription/check`,
            method: 'post',
            data,
            silence: false,
        });
    });

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
                withPaymentSwitcherContext(ChargebeeEnabled.CHARGEBEE_ALLOWED)
            ),
        });

        const status = await result.current.paymentsApi.paymentStatus();

        expect(status.VendorStates.Cash).toEqual(expectedCashValue);
    });
});
