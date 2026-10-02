import { renderHook } from '@testing-library/react-hooks';

import { hookWrapper } from '@proton/components/testing/hocs/helpers';
import { withApi } from '@proton/components/testing/hocs/with-api';
import { defaultProtonConfig, withConfig } from '@proton/components/testing/with-config';
import { withReduxStore } from '@proton/components/testing/with-redux-store';
import type { CheckSubscriptionData } from '@proton/payments/core/api/api';
import { PLANS } from '@proton/payments/core/constants';
import { APPS } from '@proton/shared/lib/constants';
import { addApiMock, apiMock } from '@proton/test-api/api';

import { usePaymentsApi } from './usePaymentsApi';

jest.mock('@proton/account/plans/hooks', () => ({
    __esModule: true,
    useGetPlans: jest.fn(),
}));

const getWrapper = () => hookWrapper(withApi(), withConfig(), withReduxStore());

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
            wrapper: getWrapper(),
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
            wrapper: getWrapper(),
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

    // TODO remove when the API rteturn the new contract
    it('should normalize transition guard fields on the check response', async () => {
        addApiMock('payments/v5/subscription/check', () => ({
            Amount: 1500,
            Currency: 'USD',
            AmountDue: 1500,
            Cycle: 12,
            GuardResult: 'You are using more storage than this plan allows.',
            GuardResultCode: 8010505,
        }));

        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper: getWrapper(),
        });

        const checkResult = await result.current.paymentsApi.checkSubscription(getCheckSubscriptionData());

        expect(checkResult.GuardResult).toEqual([
            { Code: 8010505, Message: 'You are using more storage than this plan allows.' },
        ]);
        expect(checkResult).not.toHaveProperty('GuardResultCode');
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
                withReduxStore()
            ),
        });

        const status = await result.current.paymentsApi.paymentStatus();

        expect(status.VendorStates.Cash).toEqual(expectedCashValue);
    });
});
