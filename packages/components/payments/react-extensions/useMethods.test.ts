import { renderHook } from '@testing-library/react-hooks';

import { queryPaymentMethods } from '@proton/shared/lib/api/payments';
import { wait } from '@proton/shared/lib/helpers/promise';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';
import { addApiMock, apiMock } from '@proton/testing';

import {
    Autopay,
    MethodStorage,
    PAYMENT_METHOD_TYPES,
    PaymentMethodStatusExtended,
    PaymentsApi,
    SavedPaymentMethod,
} from '../core';
import { useMethods } from './useMethods';

let paymentMethodStatusExtended: PaymentMethodStatusExtended;

let paymentMethods: SavedPaymentMethod[];

beforeEach(() => {
    jest.clearAllMocks();

    paymentMethodStatusExtended = {
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
        },
    ];

    addApiMock(queryPaymentMethods().url, () => ({
        PaymentMethods: paymentMethods,
    }));

    addApiMock('payments/v4/status', () => paymentMethodStatusExtended);
    addApiMock('payments/v5/status', () => paymentMethodStatusExtended);
});

it('should render', () => {
    const { result } = renderHook(() =>
        useMethods(
            {
                paymentMethodStatusExtended,
                amount: 100,
                flow: 'credit',
                chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
                paymentsApi: {
                    status: () => paymentMethodStatusExtended,
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

it('should initialize payment methods (no chargebee)', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
        useMethods(
            {
                paymentMethodStatusExtended,
                amount: 1000,
                flow: 'credit',
                chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
                paymentsApi: {
                    status: () => paymentMethodStatusExtended,
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

    expect(result.current.savedInternalSelectedMethod).toEqual({
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
    });

    expect(result.current.status).toEqual(paymentMethodStatusExtended);
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

it('should initialize payment methods (with chargebee)', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
        useMethods(
            {
                paymentMethodStatusExtended,
                amount: 1000,
                flow: 'credit',
                chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
                paymentsApi: {
                    status: () => paymentMethodStatusExtended,
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

    expect(result.current.savedInternalSelectedMethod).toEqual({
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
    });

    expect(result.current.status).toEqual(paymentMethodStatusExtended);
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
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            value: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        },
        {
            isSaved: false,
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            value: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
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

it('should filter out external payment methods', async () => {
    paymentMethods = [
        {
            ID: '2',
            Type: PAYMENT_METHOD_TYPES.CARD,
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
        },

        ...paymentMethods,
    ];

    const { result, waitForNextUpdate } = renderHook(() =>
        useMethods(
            {
                paymentMethodStatusExtended,
                amount: 1000,
                flow: 'credit',
                chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
                paymentsApi: {
                    status: () => paymentMethodStatusExtended,
                } as any as PaymentsApi,
                selectedPlanName: undefined,
            },
            {
                api: apiMock,
                isAuthenticated: true,
            }
        )
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
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
        },
    ]);

    result.current.selectMethod('1');
    expect(result.current.savedInternalSelectedMethod).toEqual({
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
    });

    result.current.selectMethod('2');
    expect(result.current.savedInternalSelectedMethod).toEqual(undefined);
});

it('should consider methods without External property internal', async () => {
    delete paymentMethods[0].External;
    paymentMethods = [
        {
            ID: '2',
            Type: PAYMENT_METHOD_TYPES.CARD,
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
        },
        ...paymentMethods,
    ];

    const { result, waitForNextUpdate } = renderHook(() =>
        useMethods(
            {
                paymentMethodStatusExtended,
                amount: 1000,
                flow: 'credit',
                chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
                paymentsApi: {
                    status: () => paymentMethodStatusExtended,
                } as any as PaymentsApi,
                selectedPlanName: undefined,
            },
            {
                api: apiMock,
                isAuthenticated: true,
            }
        )
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
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
        },
    ]);

    result.current.selectMethod('1');

    expect(result.current.savedInternalSelectedMethod).toEqual({
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

    result.current.selectMethod('2');
    expect(result.current.savedInternalSelectedMethod).toEqual(undefined);
});

it('should filter out internal payment methods', async () => {
    paymentMethods = [
        {
            ID: '2',
            Type: PAYMENT_METHOD_TYPES.CARD,
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
        },
        ...paymentMethods,
    ];

    const { result, waitForNextUpdate } = renderHook(() =>
        useMethods(
            {
                paymentMethodStatusExtended,
                amount: 1000,
                flow: 'credit',
                chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
                paymentsApi: {
                    status: () => paymentMethodStatusExtended,
                } as any as PaymentsApi,
                selectedPlanName: undefined,
            },
            {
                api: apiMock,
                isAuthenticated: true,
            }
        )
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
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
        },
    ]);

    result.current.selectMethod('2');
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
    });
    result.current.selectMethod('1');
    expect(result.current.savedExternalSelectedMethod).toEqual(undefined);
});

it('should update methods when amount changes', async () => {
    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ amount }) =>
            useMethods(
                {
                    paymentMethodStatusExtended,
                    amount,
                    flow: 'credit',
                    chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
                    paymentsApi: {
                        status: () => paymentMethodStatusExtended,
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
                paymentMethodStatusExtended,
                amount: 1000,
                flow: 'credit',
                chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
                paymentsApi: {
                    status: () => paymentMethodStatusExtended,
                } as any as PaymentsApi,
                selectedPlanName: undefined,
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
        External: MethodStorage.INTERNAL,
    });
});

it('should set selected method', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
        useMethods(
            {
                paymentMethodStatusExtended,
                amount: 1000,
                flow: 'credit',
                chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
                paymentsApi: {
                    status: () => paymentMethodStatusExtended,
                } as any as PaymentsApi,
                selectedPlanName: undefined,
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

    expect(result.current.savedInternalSelectedMethod).toEqual(undefined);
    expect(result.current.isNewPaypal).toBe(false);

    result.current.selectMethod('paypal');
    expect(result.current.selectedMethod).toEqual({
        isSaved: false,
        type: PAYMENT_METHOD_TYPES.PAYPAL,
        value: PAYMENT_METHOD_TYPES.PAYPAL,
    });

    expect(result.current.savedInternalSelectedMethod).toEqual(undefined);
    expect(result.current.isNewPaypal).toBe(true);
});

it('should update amount correctly even if the initialization is slow', async () => {
    addApiMock('payments/v4/status', async () => {
        await wait(100);
        return paymentMethodStatusExtended;
    });
    addApiMock('payments/v5/status', async () => {
        await wait(100);
        return paymentMethodStatusExtended;
    });

    const { result, waitForNextUpdate, rerender } = renderHook(
        ({ amount }) =>
            useMethods(
                {
                    paymentMethodStatusExtended,
                    amount,
                    flow: 'credit',
                    chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
                    paymentsApi: {
                        status: () => paymentMethodStatusExtended,
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
        }
    );

    expect(result.current.loading).toBe(true);
    rerender({
        amount: 10000,
    });

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.newMethods.length).toBe(4);
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
});
