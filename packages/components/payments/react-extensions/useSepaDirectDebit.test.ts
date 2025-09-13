import { renderHook, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';

import {
    type AmountAndCurrency,
    type ChargebeeIframeEvents,
    type ChargebeeIframeHandles,
    PAYMENT_METHOD_TYPES,
    PLANS,
} from '@proton/payments';
import { apiMock } from '@proton/testing/index';

import { getMockedIframeHandles, mockPostV5Token } from './__mocks__/mock-helpers';
import { type Dependencies, SepaEmailNotProvidedError, useSepaDirectDebit } from './useSepaDirectDebit';

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

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: {} as ChargebeeIframeHandles,
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

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
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
        type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
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

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
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

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
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
        type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
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

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
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
        type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
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

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
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
        verifyPayment: jest.fn(),
    };

    const { result, rerender } = renderHook(
        ({ selectedPlanName }) =>
            useSepaDirectDebit(
                {
                    amountAndCurrency,
                    selectedPlanName,
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

it('should throw an error when email is not provided', async () => {
    const amountAndCurrency: AmountAndCurrency = {
        Amount: 500,
        Currency: 'EUR',
    };

    const onChargeable = jest.fn();
    const onProcessPaymentToken = jest.fn();
    const onProcessPaymentTokenFailed = jest.fn();
    const selectedPlanName = PLANS.MAIL;

    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
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

    mockPostV5Token({
        data: {
            ID: 'id',
            Status: 'inited',
            Amount: 1000,
            GatewayAccountID: 'gatewayAccountID',
            ExpiresAt: 1000,
            PaymentMethodType: 'card',
            CreatedAt: 1000,
            ModifiedAt: 1000,
            UpdatedAt: 1000,
            ResourceVersion: 1,
            Object: 'payment_intent',
            CustomerID: 'customerID',
            CurrencyCode: 'EUR',
            Gateway: 'gateway',
            ReferenceID: 'referenceID',
        },
    });

    await expect(result.current.fetchPaymentToken()).rejects.toThrow(SepaEmailNotProvidedError);

    expect(result.current.fetchingToken).toBe(false);
    expect(result.current.getFetchedPaymentToken()).toEqual(null);
});

it('should report the errors reported by the validator - B2B plan', async () => {
    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
        verifyPayment: jest.fn(),
    };

    const { result, rerender } = renderHook(() =>
        useSepaDirectDebit(
            {
                amountAndCurrency: {
                    Amount: 500,
                    Currency: 'EUR',
                },
                onChargeable: jest.fn(),
                onProcessPaymentToken: jest.fn(),
                onProcessPaymentTokenFailed: jest.fn(),
                selectedPlanName: PLANS.MAIL_PRO,
            },
            dependencies
        )
    );

    await act(async () => {
        await result.current.fetchPaymentToken();
    });

    rerender();

    expect(result.current.errors.companyError).toBeDefined();
    expect(result.current.errors.ibanError).toBeDefined();

    expect(result.current.errors.firstNameError).toBeUndefined();
    expect(result.current.errors.lastNameError).toBeUndefined();
    expect(result.current.errors.addressError).toBeUndefined();
});

it('should report the errors reported by the validator - B2C plan', async () => {
    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
        verifyPayment: jest.fn(),
    };

    const { result, rerender } = renderHook(() =>
        useSepaDirectDebit(
            {
                amountAndCurrency: {
                    Amount: 500,
                    Currency: 'EUR',
                },
                onChargeable: jest.fn(),
                onProcessPaymentToken: jest.fn(),
                onProcessPaymentTokenFailed: jest.fn(),
                selectedPlanName: PLANS.MAIL,
            },
            dependencies
        )
    );

    await act(async () => {
        await result.current.fetchPaymentToken();
    });

    rerender();

    expect(result.current.errors.firstNameError).toBeDefined();
    expect(result.current.errors.lastNameError).toBeDefined();
    expect(result.current.errors.ibanError).toBeDefined();

    expect(result.current.errors.companyError).toBeUndefined();
    expect(result.current.errors.addressError).toBeUndefined();
});

it('should report the errors reported by the validator - no address provided', async () => {
    const dependencies: Dependencies = {
        api: apiMock,
        events: {} as ChargebeeIframeEvents,
        handles: getMockedIframeHandles(),
        verifyPayment: jest.fn(),
    };

    const { result, rerender } = renderHook(() =>
        useSepaDirectDebit(
            {
                amountAndCurrency: {
                    Amount: 500,
                    Currency: 'EUR',
                },
                onChargeable: jest.fn(),
                onProcessPaymentToken: jest.fn(),
                onProcessPaymentTokenFailed: jest.fn(),
                selectedPlanName: PLANS.MAIL,
            },
            dependencies
        )
    );

    expect(result.current.errors.addressError).toBeUndefined();

    await act(async () => {
        result.current.setBankAccount({ iban: 'CH9300762011623852957' });
        await result.current.fetchPaymentToken();
    });

    rerender();

    expect(result.current.errors.addressError).toBeDefined();
});
