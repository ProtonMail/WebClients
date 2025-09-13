import { renderHook, waitFor } from '@testing-library/react';

import { componentsHookRenderer, componentsHookWrapper } from '@proton/components/containers/contacts/tests/render';
import type { PaymentStatus, PaymentsApi, SavedPaymentMethod } from '@proton/payments';
import { Autopay, MethodStorage, PAYMENT_METHOD_TYPES } from '@proton/payments';
import { wait } from '@proton/shared/lib/helpers/promise';
import { addApiMock, apiMock } from '@proton/testing';

import { useMethods } from './useMethods';

let paymentStatus: PaymentStatus;

let paymentMethods: SavedPaymentMethod[];

beforeEach(() => {
    jest.clearAllMocks();

    paymentStatus = {
        CountryCode: 'US',
        State: 'AL',
        VendorStates: {
            Card: true,
            Paypal: true,
            Apple: true,
            Cash: true,
            Bitcoin: true,
        },
    };

    paymentMethods = [
        {
            ID: '1',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
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
            External: MethodStorage.EXTERNAL,
            IsDefault: true,
        },
    ];

    addApiMock('payments/v5/methods', () => ({
        PaymentMethods: paymentMethods,
    }));

    addApiMock('payments/v5/status', () => paymentStatus);
});

it('should render', () => {
    const { result } = componentsHookRenderer(() =>
        useMethods(
            {
                paymentStatus,
                amount: 100,
                currency: 'USD',
                flow: 'credit',
                paymentsApi: {
                    status: () => paymentStatus,
                } as any as PaymentsApi,
                selectedPlanName: undefined,
            },
            {
                api: apiMock,
                isAuthenticated: true,
            }
        )
    );

    expect(result.current).toBeDefined();
});

it('should initialize payment methods (with chargebee)', async () => {
    const { result } = componentsHookRenderer(() =>
        useMethods(
            {
                paymentStatus,
                amount: 1000,
                currency: 'USD',
                flow: 'credit',
                paymentsApi: {
                    status: () => paymentStatus,
                } as any as PaymentsApi,
                selectedPlanName: undefined,
            },
            {
                api: apiMock,
                isAuthenticated: true,
            }
        )
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });
    expect(result.current.savedMethods).toEqual(paymentMethods);

    expect(result.current.selectedMethod).toEqual({
        isDefault: true,
        isExpired: false,
        isSaved: true,
        paymentMethodId: '1',
        type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        value: '1',
    });

    expect(result.current.savedExternalSelectedMethod).toEqual({
        ID: '1',
        Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
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
        External: MethodStorage.EXTERNAL,
        IsDefault: true,
    });

    expect(result.current.status).toEqual(paymentStatus);
    expect(result.current.isNewPaypal).toBe(false);
    expect(result.current.usedMethods).toEqual([
        {
            isDefault: true,
            isExpired: false,
            isSaved: true,
            paymentMethodId: '1',
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            value: '1',
        },
    ]);
    expect(result.current.newMethods).toEqual([
        {
            isDefault: false,
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            value: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        },
        {
            isDefault: false,
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            value: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
        },
        {
            isDefault: false,
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
            value: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
        },
        {
            isDefault: false,
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CASH,
            value: PAYMENT_METHOD_TYPES.CASH,
        },
    ]);
    expect(result.current.lastUsedMethod).toEqual({
        isDefault: true,
        isExpired: false,
        isSaved: true,
        paymentMethodId: '1',
        type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        value: '1',
    });
});

it('should filter out internal payment methods', async () => {
    paymentMethods = [
        {
            ID: '2',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            Order: 499,
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
            External: MethodStorage.EXTERNAL,
            IsDefault: true,
        },
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
            External: MethodStorage.INTERNAL,
            IsDefault: false,
        },
    ];

    const { result } = componentsHookRenderer(() =>
        useMethods(
            {
                paymentStatus,
                amount: 1000,
                currency: 'USD',
                flow: 'credit',
                paymentsApi: {
                    status: () => paymentStatus,
                } as any as PaymentsApi,
                selectedPlanName: undefined,
            },
            {
                api: apiMock,
                isAuthenticated: true,
            }
        )
    );

    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });
    expect(result.current.savedMethods).toEqual([
        {
            ID: '2',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            Order: 499,
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
            External: MethodStorage.EXTERNAL,
            IsDefault: true,
        },
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
            External: MethodStorage.INTERNAL,
            IsDefault: false,
        },
    ]);

    result.current.selectMethod('2');
    await waitFor(() => {
        expect(result.current.savedExternalSelectedMethod).toEqual({
            ID: '2',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            Order: 499,
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
            External: MethodStorage.EXTERNAL,
            IsDefault: true,
        });
    });
    result.current.selectMethod('1');
    await waitFor(() => {
        expect(result.current.savedExternalSelectedMethod).toEqual(undefined);
    });
});

it('should update methods when amount changes', async () => {
    const { result, rerender } = renderHook(
        ({ amount }) =>
            useMethods(
                {
                    paymentStatus,
                    amount,
                    currency: 'USD',
                    flow: 'credit',
                    paymentsApi: {
                        status: () => paymentStatus,
                    } as any as PaymentsApi,
                    selectedPlanName: undefined,
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
            wrapper: componentsHookWrapper,
        }
    );

    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });
    expect(result.current.savedMethods).toEqual(paymentMethods);

    rerender({
        amount: 100,
    });

    await waitFor(() => {
        expect(result.current.newMethods).toEqual([
            {
                isSaved: false,
                type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                value: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                isDefault: false,
            },
            {
                isSaved: false,
                type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                value: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                isDefault: false,
            },
            {
                isSaved: false,
                type: PAYMENT_METHOD_TYPES.CASH,
                value: PAYMENT_METHOD_TYPES.CASH,
                isDefault: false,
            },
        ]);
    });
});

it('should get saved method by its ID', async () => {
    const { result } = componentsHookRenderer(() =>
        useMethods(
            {
                paymentStatus,
                amount: 1000,
                currency: 'USD',
                flow: 'credit',
                paymentsApi: {
                    status: () => paymentStatus,
                } as any as PaymentsApi,
                selectedPlanName: undefined,
            },
            {
                api: apiMock,
                isAuthenticated: true,
            }
        )
    );

    await waitFor(() => {
        expect(result.current.getSavedMethodByID('1')).toEqual({
            ID: '1',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
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
            External: MethodStorage.EXTERNAL,
            IsDefault: true,
        });
    });
});

it('should set selected method', async () => {
    const { result } = componentsHookRenderer(() =>
        useMethods(
            {
                paymentStatus,
                amount: 1000,
                currency: 'USD',
                flow: 'credit',
                paymentsApi: {
                    status: () => paymentStatus,
                } as any as PaymentsApi,
                selectedPlanName: undefined,
            },
            {
                api: apiMock,
                isAuthenticated: true,
            }
        )
    );

    await waitFor(() => {
        expect(result.current.selectedMethod).toEqual({
            isDefault: true,
            isExpired: false,
            isSaved: true,
            paymentMethodId: '1',
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            value: '1',
        });
    });

    result.current.selectMethod('chargebee-card');

    await waitFor(() => {
        expect(result.current.selectedMethod).toEqual({
            isDefault: false,
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            value: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        });
    });

    expect(result.current.savedInternalSelectedMethod).toEqual(undefined);
    expect(result.current.savedExternalSelectedMethod).toEqual(undefined);
    expect(result.current.isNewPaypal).toBe(false);

    result.current.selectMethod('chargebee-paypal');
    await waitFor(() => {
        expect(result.current.selectedMethod).toEqual({
            isDefault: false,
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            value: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
        });
    });

    expect(result.current.savedInternalSelectedMethod).toEqual(undefined);
    expect(result.current.savedExternalSelectedMethod).toEqual(undefined);
    expect(result.current.isNewPaypal).toBe(false);
});

it('should update amount correctly even if the initialization is slow', async () => {
    addApiMock('payments/v5/status', async () => {
        await wait(100);
        return paymentStatus;
    });

    const { result, rerender } = renderHook(
        ({ amount }) =>
            useMethods(
                {
                    paymentStatus,
                    amount,
                    currency: 'USD',
                    flow: 'credit',
                    paymentsApi: {
                        status: () => paymentStatus,
                    } as any as PaymentsApi,
                    selectedPlanName: undefined,
                },
                {
                    api: apiMock,
                    isAuthenticated: true,
                }
            ),
        {
            initialProps: {
                amount: 0,
            },
            wrapper: componentsHookWrapper,
        }
    );

    expect(result.current.loading).toBe(true);
    rerender({
        amount: 10000,
    });

    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });
    expect(result.current.newMethods.length).toBe(4);
    expect(result.current.newMethods).toEqual([
        {
            isDefault: false,
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            value: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        },
        {
            isDefault: false,
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            value: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
        },
        {
            isDefault: false,
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
            value: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
        },
        {
            isDefault: false,
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CASH,
            value: PAYMENT_METHOD_TYPES.CASH,
        },
    ]);
});
