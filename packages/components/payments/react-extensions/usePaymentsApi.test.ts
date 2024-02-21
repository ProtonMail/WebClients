import { renderHook } from '@testing-library/react-hooks';

import { CheckSubscriptionData } from '@proton/shared/lib/api/payments';
import { PLANS } from '@proton/shared/lib/constants';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';
import { addApiMock, apiMock, hookWrapper, withApi } from '@proton/testing/index';

import { useChargebeeEnabledCache, useChargebeeKillSwitch } from '../client-extensions/useChargebeeContext';
import { usePaymentsApi } from './usePaymentsApi';

const wrapper = hookWrapper(withApi());

const mockInhouseForced = ChargebeeEnabled.INHOUSE_FORCED;

const mockUseChargebeeEnabledCache = useChargebeeEnabledCache as jest.Mock;
const mockUseChargebeeKillSwitch = useChargebeeKillSwitch as jest.Mock;

const mockV5StatusResponse = {
    Code: 1000,
    CountryCode: 'CH',
    ZipCode: '3001',
    State: null,
    VendorStates: {
        Apple: 1,
        Bitcoin: 1,
        Card: 1,
        InApp: 0,
        Paypal: 1,
    },
};

const mockV4StatusResponse = {
    Apple: 1,
    Bitcoin: 1,
    Card: 1,
    InApp: 0,
    Paypal: 1,
};

jest.mock('../client-extensions/useChargebeeContext', () => ({
    __esModule: true,
    useChargebeeEnabledCache: jest.fn().mockReturnValue(mockInhouseForced),
    useChargebeeKillSwitch: jest.fn().mockReturnValue({ chargebeeKillSwitch: jest.fn().mockReturnValue(true) }),
}));

beforeEach(() => {
    jest.clearAllMocks();

    addApiMock('payments/v5/status', () => mockV5StatusResponse);
    addApiMock('payments/v4/status', () => mockV4StatusResponse);
});

describe('usePaymentsApi', () => {
    it('returns an object with paymentsApi and getPaymentsApi properties', () => {
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper,
        });
        expect(result.current).toHaveProperty('paymentsApi');
        expect(result.current).toHaveProperty('getPaymentsApi');
    });

    it('should call v4 status when user is inhouse forced', () => {
        mockUseChargebeeEnabledCache.mockReturnValue(ChargebeeEnabled.INHOUSE_FORCED);
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper,
        });

        void result.current.paymentsApi.statusExtendedAutomatic();
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v4/status`,
            method: 'get',
        });
    });

    it('should call v5 status when user is chargebee forced', () => {
        mockUseChargebeeEnabledCache.mockReturnValue(ChargebeeEnabled.CHARGEBEE_FORCED);
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper,
        });

        void result.current.paymentsApi.statusExtendedAutomatic();
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/status`,
            method: 'get',
        });
    });

    it('should call v5 status when user is chargebee allowed', () => {
        mockUseChargebeeEnabledCache.mockReturnValue(ChargebeeEnabled.CHARGEBEE_ALLOWED);
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper,
        });

        void result.current.paymentsApi.statusExtendedAutomatic();
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/status`,
            method: 'get',
        });
    });

    it('should trigger kill switch when status failes for chargebee allowed user', async () => {
        apiMock.mockRejectedValueOnce(new Error('status call failed in the unit test'));
        mockUseChargebeeEnabledCache.mockReturnValue(ChargebeeEnabled.CHARGEBEE_ALLOWED);
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper,
        });

        await expect(result.current.paymentsApi.statusExtendedAutomatic()).resolves.toEqual({
            VendorStates: {
                Apple: 1,
                Bitcoin: 1,
                Card: 1,
                InApp: 0,
                Paypal: 1,
            },
        });
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/status`,
            method: 'get',
        });
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v4/status`,
            method: 'get',
        });
        expect(mockUseChargebeeKillSwitch).toHaveBeenCalled();
    });

    it('should not call v4 if kill switch was not triggered and returned false', async () => {
        apiMock.mockRejectedValueOnce(new Error('status call failed in the unit test'));
        mockUseChargebeeKillSwitch.mockReturnValue({ chargebeeKillSwitch: jest.fn().mockReturnValue(false) });
        mockUseChargebeeEnabledCache.mockReturnValue(ChargebeeEnabled.CHARGEBEE_ALLOWED);
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper,
        });

        await expect(result.current.paymentsApi.statusExtendedAutomatic()).rejects.toThrow(
            'status call failed in the unit test'
        );
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/status`,
            method: 'get',
        });
        expect(apiMock).not.toHaveBeenCalledWith({
            url: `payments/v4/status`,
            method: 'get',
        });
        expect(mockUseChargebeeKillSwitch).toHaveBeenCalled();
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
        mockUseChargebeeEnabledCache.mockReturnValue(ChargebeeEnabled.INHOUSE_FORCED);
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper,
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
        mockUseChargebeeEnabledCache.mockReturnValue(ChargebeeEnabled.CHARGEBEE_FORCED);
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper,
        });

        const data = getCheckSubscriptionData();
        void result.current.paymentsApi.checkWithAutomaticVersion(data);
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/subscription/check`,
            method: 'post',
            data,
        });
    });

    it('should call v5 check when user is chargebee allowed', () => {
        mockUseChargebeeEnabledCache.mockReturnValue(ChargebeeEnabled.CHARGEBEE_ALLOWED);
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper,
        });

        const data = getCheckSubscriptionData();
        void result.current.paymentsApi.checkWithAutomaticVersion(data);
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/subscription/check`,
            method: 'post',
            data,
        });
    });

    it('should trigger kill switch when check failes for chargebee allowed user', async () => {
        apiMock.mockRejectedValueOnce(new Error('check call failed in the unit test'));
        mockUseChargebeeEnabledCache.mockReturnValue(ChargebeeEnabled.CHARGEBEE_ALLOWED);
        mockUseChargebeeKillSwitch.mockReturnValue({ chargebeeKillSwitch: jest.fn().mockReturnValue(true) });
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper,
        });

        const data = getCheckSubscriptionData();
        await result.current.paymentsApi.checkWithAutomaticVersion(data);
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/subscription/check`,
            method: 'post',
            data,
        });
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v4/subscription/check`,
            method: 'post',
            data,
        });
        expect(mockUseChargebeeKillSwitch).toHaveBeenCalled();
    });

    it('should not call v4 if kill switch was not triggered and returned false', async () => {
        apiMock.mockRejectedValueOnce(new Error('check call failed in the unit test'));
        mockUseChargebeeKillSwitch.mockReturnValue({ chargebeeKillSwitch: jest.fn().mockReturnValue(false) });
        mockUseChargebeeEnabledCache.mockReturnValue(ChargebeeEnabled.CHARGEBEE_ALLOWED);
        const { result } = renderHook(() => usePaymentsApi(), {
            wrapper,
        });

        const data = getCheckSubscriptionData();
        await expect(result.current.paymentsApi.checkWithAutomaticVersion(data)).rejects.toThrow(
            'check call failed in the unit test'
        );
        expect(apiMock).toHaveBeenCalledWith({
            url: `payments/v5/subscription/check`,
            method: 'post',
            data,
        });
        expect(apiMock).not.toHaveBeenCalledWith({
            url: `payments/v4/subscription/check`,
            method: 'post',
            data,
        });
        expect(mockUseChargebeeKillSwitch).toHaveBeenCalled();
    });
});
