import { renderHook, waitFor } from '@testing-library/react';

import {
    type AmountAndCurrency,
    type ChargebeeIframeEvents,
    type ChargebeeIframeHandles,
    PLANS,
} from '@proton/payments';
import { buildUser } from '@proton/testing/builders';
import { apiMock } from '@proton/testing/index';

import { getMockedIframeHandles, mockPostV5Token } from './__mocks__/mock-helpers';
import { type Dependencies } from './useChargebeeCard';
import { useSepaDirectDebit } from './useSepaDirectDebit';

beforeEach(() => {
    jest.clearAllMocks();
});

it('should render', () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 500,
        Currency: 'EUR',
    };

    const onChargeable = jest.fn();
    const onProcessPaymentToken = jest.fn();
    const onProcessPaymentTokenFailed = jest.fn();
    const selectedPlanName = PLANS.MAIL;
    const user = buildUser({
        Email: 'test@proton.me',
    });

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: {} as ChargebeeIframeHandles,
        forceEnableChargebee: jest.fn(),
        verifyPayment: jest.fn(),
    };

    const { result } = renderHook(() =>
        useSepaDirectDebit(
            {
                amountAndCurrency,
                onChargeable,
                onProcessPaymentToken,
                onProcessPaymentTokenFailed,
                selectedPlanName,
                user,
            },
            dependencies
        )
    );

    expect(result.current).toBeDefined();
});

it('should fetch payment token', async () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 500,
        Currency: 'EUR',
    };

    const onChargeable = jest.fn();
    const onProcessPaymentToken = jest.fn();
    const onProcessPaymentTokenFailed = jest.fn();
    const selectedPlanName = PLANS.MAIL;
    const user = buildUser({
        Email: 'test@proton.me',
    });

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
        forceEnableChargebee: jest.fn(),
        verifyPayment: jest.fn(),
    };

    const { result } = renderHook(() =>
        useSepaDirectDebit(
            {
                amountAndCurrency,
                onChargeable,
                onProcessPaymentToken,
                onProcessPaymentTokenFailed,
                selectedPlanName,
                user,
            },
            dependencies
        )
    );

    result.current.setBankAccount({ iban: 'DE89370400440532013000' });
    result.current.setCustomerNameType('individual');
    result.current.setFirstName('Arthur');
    result.current.setLastName('Morgan');
    result.current.setEmail('arthur.morgan@example.com');
    result.current.setCountryCode('DE');
    result.current.setAddressLine1('address line 1');

    await waitFor(() => {
        expect(result.current.bankAccount).toEqual({ iban: 'DE89370400440532013000' });
    });

    expect(result.current.fetchingToken).toBe(false);
    expect(result.current.getFetchedPaymentToken()).toBe(null);

    mockPostV5Token({});
    const promise = result.current.fetchPaymentToken();

    await promise;

    expect(result.current.fetchingToken).toBe(false);
    expect(result.current.getFetchedPaymentToken()).toEqual({
        Amount: 500,
        Currency: 'EUR',
        PaymentToken: 'token',
        v: 5,
        chargeable: true,
        authorized: true,
        type: 'sepadirectdebit',
    });
});

it('should not request payment token if onBeforeSepaPayment returns false', async () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 500,
        Currency: 'EUR',
    };

    const onChargeable = jest.fn();
    const onProcessPaymentToken = jest.fn();
    const onProcessPaymentTokenFailed = jest.fn();
    const selectedPlanName = PLANS.MAIL;
    const user = buildUser({
        Email: 'test@proton.me',
    });

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
        forceEnableChargebee: jest.fn(),
        verifyPayment: jest.fn(),
    };

    const onBeforeSepaPayment = jest.fn();
    onBeforeSepaPayment.mockReturnValue(false);

    const { result } = renderHook(() =>
        useSepaDirectDebit(
            {
                amountAndCurrency,
                onChargeable,
                onProcessPaymentToken,
                onProcessPaymentTokenFailed,
                selectedPlanName,
                user,
                onBeforeSepaPayment,
            },
            dependencies
        )
    );

    result.current.setBankAccount({ iban: 'DE89370400440532013000' });
    result.current.setCustomerNameType('individual');
    result.current.setFirstName('Arthur');
    result.current.setLastName('Morgan');
    result.current.setEmail('arthur.morgan@example.com');
    result.current.setCountryCode('DE');
    result.current.setAddressLine1('address line 1');

    await waitFor(() => {
        expect(result.current.bankAccount).toEqual({ iban: 'DE89370400440532013000' });
    });

    const promise = result.current.fetchPaymentToken();
    await promise;

    expect(onBeforeSepaPayment).toHaveBeenCalled();
    expect(result.current.fetchingToken).toBe(false);
    expect(result.current.getFetchedPaymentToken()).toBe(null);
});

it('should verify payment token', async () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 500,
        Currency: 'EUR',
    };

    const onChargeable = jest.fn();
    const onProcessPaymentToken = jest.fn();
    const onProcessPaymentTokenFailed = jest.fn();
    const selectedPlanName = PLANS.MAIL;
    const user = buildUser({
        Email: 'test@proton.me',
    });

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
        forceEnableChargebee: jest.fn(),
        verifyPayment: jest.fn().mockImplementation((data) => {
            return {
                PaymentToken: data.token.PaymentToken,
                v: 5,
            };
        }),
    };

    const { result } = renderHook(() =>
        useSepaDirectDebit(
            {
                amountAndCurrency,
                onChargeable,
                onProcessPaymentToken,
                onProcessPaymentTokenFailed,
                selectedPlanName,
                user,
            },
            dependencies
        )
    );

    result.current.setBankAccount({ iban: 'DE89370400440532013000' });
    result.current.setCustomerNameType('individual');
    result.current.setFirstName('Arthur');
    result.current.setLastName('Morgan');
    result.current.setEmail('arthur.morgan@example.com');
    result.current.setCountryCode('DE');
    result.current.setAddressLine1('address line 1');

    await waitFor(() => {
        expect(result.current.bankAccount).toEqual({ iban: 'DE89370400440532013000' });
    });

    mockPostV5Token({});
    await result.current.fetchPaymentToken();

    const verifiedToken = await result.current.verifyPaymentToken();

    expect(verifiedToken).toEqual({
        Amount: 500,
        Currency: 'EUR',
        PaymentToken: 'token',
        v: 5,
        chargeable: true,
        type: 'sepadirectdebit',
    });
});

it('should not verify token if amount is 0', async () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 0,
        Currency: 'EUR',
    };

    const onChargeable = jest.fn();
    const onProcessPaymentToken = jest.fn();
    const onProcessPaymentTokenFailed = jest.fn();
    const selectedPlanName = PLANS.MAIL;
    const user = buildUser({
        Email: 'test@proton.me',
    });

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
        forceEnableChargebee: jest.fn(),
        verifyPayment: jest.fn(),
    };

    const { result } = renderHook(() =>
        useSepaDirectDebit(
            {
                amountAndCurrency,
                onChargeable,
                onProcessPaymentToken,
                onProcessPaymentTokenFailed,
                selectedPlanName,
                user,
            },
            dependencies
        )
    );

    result.current.setBankAccount({ iban: 'DE89370400440532013000' });
    result.current.setCustomerNameType('individual');
    result.current.setFirstName('Arthur');
    result.current.setLastName('Morgan');
    result.current.setEmail('arthur.morgan@example.com');
    result.current.setCountryCode('DE');
    result.current.setAddressLine1('address line 1');

    await waitFor(() => {
        expect(result.current.bankAccount).toEqual({ iban: 'DE89370400440532013000' });
    });

    mockPostV5Token({});
    await result.current.fetchPaymentToken();

    const verifiedToken = await result.current.verifyPaymentToken();

    expect(verifiedToken).toEqual({
        Amount: 0,
        Currency: 'EUR',
        v: 5,
        chargeable: true,
        type: 'sepadirectdebit',
    });
});

it('should reset token if verification fails', async () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 500,
        Currency: 'EUR',
    };

    const onChargeable = jest.fn();
    const onProcessPaymentToken = jest.fn();
    const onProcessPaymentTokenFailed = jest.fn();
    const selectedPlanName = PLANS.MAIL;
    const user = buildUser({
        Email: 'test@proton.me',
    });

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
        forceEnableChargebee: jest.fn(),
        // rejects the promise
        verifyPayment: jest.fn().mockImplementation(() => {
            return Promise.reject(new Error('Verification failed'));
        }),
    };

    const { result } = renderHook(() =>
        useSepaDirectDebit(
            {
                amountAndCurrency,
                onChargeable,
                onProcessPaymentToken,
                onProcessPaymentTokenFailed,
                selectedPlanName,
                user,
            },
            dependencies
        )
    );

    result.current.setBankAccount({ iban: 'DE89370400440532013000' });
    result.current.setCustomerNameType('individual');
    result.current.setFirstName('Arthur');
    result.current.setLastName('Morgan');
    result.current.setEmail('arthur.morgan@example.com');
    result.current.setCountryCode('DE');
    result.current.setAddressLine1('address line 1');

    await waitFor(() => {
        expect(result.current.bankAccount).toEqual({ iban: 'DE89370400440532013000' });
    });

    mockPostV5Token({});
    await result.current.fetchPaymentToken();

    expect(result.current.getFetchedPaymentToken()).not.toBe(null);
    await expect(result.current.verifyPaymentToken()).rejects.toThrow('Verification failed');

    expect(result.current.getFetchedPaymentToken()).toBe(null);
});

it('automatically sets customer name type to company if plan is B2B', () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 500,
        Currency: 'EUR',
    };

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
        forceEnableChargebee: jest.fn(),
        verifyPayment: jest.fn(),
    };

    const { result, rerender } = renderHook(
        ({ selectedPlanName }) =>
            useSepaDirectDebit(
                {
                    amountAndCurrency,
                    selectedPlanName,
                    user: buildUser({
                        Email: 'test@proton.me',
                    }),
                },
                dependencies
            ),
        { initialProps: { selectedPlanName: PLANS.MAIL } }
    );

    expect(result.current.customer.customerNameType).toBe('individual');

    rerender({
        selectedPlanName: PLANS.MAIL_PRO,
    });

    expect(result.current.customer.customerNameType).toBe('company');
});
