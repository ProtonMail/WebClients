import { renderHook } from '@testing-library/react-hooks';

import { queryPaymentMethodStatus, queryPaymentMethods } from '@proton/shared/lib/api/payments';
import { addApiMock, apiMock } from '@proton/testing';

import { Autopay, PAYMENT_METHOD_TYPES, PaymentMethodStatus, SavedPaymentMethod } from '../core';
import { useMethods } from './useMethods';

let paymentMethodStatus: PaymentMethodStatus;

let paymentMethods: SavedPaymentMethod[] = [
    {
        ID: '1',
        Type: PAYMENT_METHOD_TYPES.CARD,
        Order: 500,
        Autopay: Autopay.ENABLE,
        Details: {
            Name: 'Arthur Morgan',
            ExpMonth: '12',
            ExpYear: '2030',
            ZIP: '12345',
            Country: 'US',
            Last4: '1234',
            Brand: 'Visa',
        },
    },
];

beforeEach(() => {
    jest.clearAllMocks();

    paymentMethodStatus = {
        Card: true,
        Paypal: true,
        Apple: true,
        Cash: true,
        Bitcoin: true,
    };

    addApiMock(queryPaymentMethods().url, () => ({
        PaymentMethods: paymentMethods,
    }));

    addApiMock(queryPaymentMethodStatus().url, () => paymentMethodStatus);
});

it('should render', () => {
    const { result } = renderHook(() =>
        useMethods(
            {
                paymentMethodStatus,
                amount: 100,
                flow: 'credit',
            },
            {
                api: apiMock,
                isAuthenticated: true,
            }
        )
    );

    expect(result.current).toBeDefined();
});

it('should initialize payment methods', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
        useMethods(
            {
                paymentMethodStatus,
                amount: 1000,
                flow: 'credit',
            },
            {
                api: apiMock,
                isAuthenticated: true,
            }
        )
    );

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.savedMethods).toEqual(paymentMethods);
    expect(result.current.selectedMethod).toEqual({
        isExpired: false,
        isSaved: true,
        paymentMethodId: '1',
        type: PAYMENT_METHOD_TYPES.CARD,
        value: '1',
    });

    expect(result.current.savedSelectedMethod).toEqual({
        ID: '1',
        Type: PAYMENT_METHOD_TYPES.CARD,
        Order: 500,
        Autopay: Autopay.ENABLE,
        Details: {
            Name: 'Arthur Morgan',
            ExpMonth: '12',
            ExpYear: '2030',
            ZIP: '12345',
            Country: 'US',
            Last4: '1234',
            Brand: 'Visa',
        },
    });

    expect(result.current.status).toEqual(paymentMethodStatus);
    expect(result.current.isNewPaypal).toBe(false);
    expect(result.current.usedMethods).toEqual([
        {
            isExpired: false,
            isSaved: true,
            paymentMethodId: '1',
            type: PAYMENT_METHOD_TYPES.CARD,
            value: '1',
        },
    ]);
    expect(result.current.newMethods).toEqual([
        {
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CARD,
            value: PAYMENT_METHOD_TYPES.CARD,
        },
        {
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.PAYPAL,
            value: PAYMENT_METHOD_TYPES.PAYPAL,
        },
        {
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.BITCOIN,
            value: PAYMENT_METHOD_TYPES.BITCOIN,
        },
        {
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CASH,
            value: PAYMENT_METHOD_TYPES.CASH,
        },
    ]);
    expect(result.current.lastUsedMethod).toEqual({
        isExpired: false,
        isSaved: true,
        paymentMethodId: '1',
        type: PAYMENT_METHOD_TYPES.CARD,
        value: '1',
    });
});

it('should update methods when amount changes', async () => {
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ amount }) =>
            useMethods(
                {
                    paymentMethodStatus,
                    amount,
                    flow: 'credit',
                },
                {
                    api: apiMock,
                    isAuthenticated: true,
                }
            ),
        {
            initialProps: {
                amount: 1000,
            },
        }
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.savedMethods).toEqual(paymentMethods);

    rerender({
        amount: 100,
    });

    expect(result.current.newMethods).toEqual([
        {
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CARD,
            value: PAYMENT_METHOD_TYPES.CARD,
        },
        {
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CASH,
            value: PAYMENT_METHOD_TYPES.CASH,
        },
    ]);
});

it('should get saved method by its ID', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
        useMethods(
            {
                paymentMethodStatus,
                amount: 1000,
                flow: 'credit',
            },
            {
                api: apiMock,
                isAuthenticated: true,
            }
        )
    );

    await waitForNextUpdate();

    expect(result.current.getSavedMethodByID('1')).toEqual({
        ID: '1',
        Type: PAYMENT_METHOD_TYPES.CARD,
        Order: 500,
        Autopay: Autopay.ENABLE,
        Details: {
            Name: 'Arthur Morgan',
            ExpMonth: '12',
            ExpYear: '2030',
            ZIP: '12345',
            Country: 'US',
            Last4: '1234',
            Brand: 'Visa',
        },
    });
});

it('should set selected method', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
        useMethods(
            {
                paymentMethodStatus,
                amount: 1000,
                flow: 'credit',
            },
            {
                api: apiMock,
                isAuthenticated: true,
            }
        )
    );

    await waitForNextUpdate();

    expect(result.current.selectedMethod).toEqual({
        isExpired: false,
        isSaved: true,
        paymentMethodId: '1',
        type: PAYMENT_METHOD_TYPES.CARD,
        value: '1',
    });

    result.current.selectMethod('card');

    expect(result.current.selectedMethod).toEqual({
        isSaved: false,
        type: PAYMENT_METHOD_TYPES.CARD,
        value: PAYMENT_METHOD_TYPES.CARD,
    });

    expect(result.current.savedSelectedMethod).toEqual(undefined);
    expect(result.current.isNewPaypal).toBe(false);

    result.current.selectMethod('paypal');
    expect(result.current.selectedMethod).toEqual({
        isSaved: false,
        type: PAYMENT_METHOD_TYPES.PAYPAL,
        value: PAYMENT_METHOD_TYPES.PAYPAL,
    });

    expect(result.current.savedSelectedMethod).toEqual(undefined);
    expect(result.current.isNewPaypal).toBe(true);
});
