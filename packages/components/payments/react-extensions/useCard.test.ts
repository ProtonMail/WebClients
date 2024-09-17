import { renderHook } from '@testing-library/react-hooks';

import { InvalidCardDataError, PAYMENT_TOKEN_STATUS } from '@proton/payments';
import { addTokensResponse, apiMock } from '@proton/testing';

import { type Props, useCard } from './useCard';

const mockVerifyPayment = jest.fn();
const onChargeableMock = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();

    addTokensResponse();
});

it('should render', () => {
    const { result } = renderHook(() =>
        useCard(
            { amountAndCurrency: { Amount: 100, Currency: 'USD' }, onChargeable: onChargeableMock },
            { api: apiMock, verifyPayment: mockVerifyPayment }
        )
    );

    expect(result.current).toBeDefined();
    expect(result.current.meta.type).toEqual('card');
});

it('should return empty card by default', () => {
    const { result } = renderHook(() =>
        useCard(
            { amountAndCurrency: { Amount: 100, Currency: 'USD' }, onChargeable: onChargeableMock },
            { api: apiMock, verifyPayment: mockVerifyPayment }
        )
    );

    expect(result.current.card).toEqual({
        number: '',
        month: '',
        year: '',
        cvc: '',
        zip: '',
        country: 'US',
    });

    expect(result.current.submitted).toEqual(false);
    expect(result.current.errors).toEqual({});
});

it('should have false loading statuses by default', () => {
    const { result } = renderHook(() =>
        useCard(
            { amountAndCurrency: { Amount: 100, Currency: 'USD' }, onChargeable: onChargeableMock },
            { api: apiMock, verifyPayment: mockVerifyPayment }
        )
    );

    expect(result.current.fetchingToken).toEqual(false);
    expect(result.current.verifyingToken).toEqual(false);
    expect(result.current.processingToken).toEqual(false);
});

it('should update amount and currency', () => {
    const { result, rerender } = renderHook(
        (props: Props) => useCard(props, { api: apiMock, verifyPayment: mockVerifyPayment }),
        {
            initialProps: { amountAndCurrency: { Amount: 100, Currency: 'USD' }, onChargeable: onChargeableMock },
        }
    );

    expect(result.current.paymentProcessor.amountAndCurrency).toEqual({ Amount: 100, Currency: 'USD' });

    rerender({ amountAndCurrency: { Amount: 200, Currency: 'EUR' }, onChargeable: onChargeableMock });

    expect(result.current.paymentProcessor.amountAndCurrency).toEqual({ Amount: 200, Currency: 'EUR' });
});

it('should not update the processor between renders', () => {
    const { result, rerender } = renderHook(
        (props: Props) => useCard(props, { api: apiMock, verifyPayment: mockVerifyPayment }),
        {
            initialProps: { amountAndCurrency: { Amount: 100, Currency: 'USD' }, onChargeable: onChargeableMock },
        }
    );

    const processor = result.current.paymentProcessor;

    rerender({ amountAndCurrency: { Amount: 200, Currency: 'EUR' }, onChargeable: onChargeableMock });

    expect(result.current.paymentProcessor).toEqual(processor);
});

it('should destroy the processor on unmount', () => {
    const { result, unmount } = renderHook(
        (props: Props) => useCard(props, { api: apiMock, verifyPayment: mockVerifyPayment }),
        {
            initialProps: { amountAndCurrency: { Amount: 100, Currency: 'USD' }, onChargeable: onChargeableMock },
        }
    );

    const processor = result.current.paymentProcessor;
    processor.destroy = jest.fn();

    unmount();

    expect(processor.destroy).toHaveBeenCalled();
});

it('should throw an error if there are no card details and user wants to fetch token', async () => {
    const { result } = renderHook(
        (props: Props) => useCard(props, { api: apiMock, verifyPayment: mockVerifyPayment }),
        {
            initialProps: { amountAndCurrency: { Amount: 100, Currency: 'USD' }, onChargeable: onChargeableMock },
        }
    );

    await expect(result.current.fetchPaymentToken()).rejects.toThrowError(InvalidCardDataError);
});

it('should fetch payment token when the card is provided initially', async () => {
    const { result } = renderHook(
        (props: Props) => useCard(props, { api: apiMock, verifyPayment: mockVerifyPayment }),
        {
            initialProps: {
                amountAndCurrency: { Amount: 100, Currency: 'USD' },
                onChargeable: onChargeableMock,
                initialCard: {
                    number: '4242424242424242',
                    month: '12',
                    year: '2032',
                    cvc: '123',
                    zip: '12345',
                    country: 'US',
                },
            },
        }
    );

    expect(result.current.fetchingToken).toEqual(false);
    expect(result.current.verifyingToken).toEqual(false);
    expect(result.current.processingToken).toEqual(false);

    const tokenPromise = result.current.fetchPaymentToken();

    expect(result.current.fetchingToken).toEqual(true);
    expect(result.current.verifyingToken).toEqual(false);
    expect(result.current.processingToken).toEqual(true);

    const token = await tokenPromise;

    expect(result.current.fetchingToken).toEqual(false);
    expect(result.current.verifyingToken).toEqual(false);
    expect(result.current.processingToken).toEqual(false);

    expect(token).toEqual({
        Amount: 100,
        Currency: 'USD',
        PaymentToken: 'token123',
        v: 5,
        chargeable: true,
        type: 'card',
    });
});

it('should fetch payment token when the card is provided later', async () => {
    const { result } = renderHook(
        (props: Props) => useCard(props, { api: apiMock, verifyPayment: mockVerifyPayment }),
        {
            initialProps: {
                amountAndCurrency: { Amount: 100, Currency: 'USD' },
                onChargeable: onChargeableMock,
            },
        }
    );

    expect(result.current.fetchingToken).toEqual(false);

    result.current.setCardProperty('number', '4242424242424242');
    result.current.setCardProperty('month', '12');
    result.current.setCardProperty('year', '2032');
    result.current.setCardProperty('cvc', '123');
    result.current.setCardProperty('zip', '12345');
    result.current.setCardProperty('country', 'US');

    expect(result.current.fetchingToken).toEqual(false);

    const tokenPromise = result.current.fetchPaymentToken();

    expect(result.current.fetchingToken).toEqual(true);

    const token = await tokenPromise;

    expect(result.current.fetchingToken).toEqual(false);

    expect(token).toEqual({
        Amount: 100,
        Currency: 'USD',
        PaymentToken: 'token123',
        v: 5,
        chargeable: true,
        type: 'card',
    });
});

it('should reset payment token when currency or amount is changed', async () => {
    const { result, rerender } = renderHook(
        (props: Props) => useCard(props, { api: apiMock, verifyPayment: mockVerifyPayment }),
        {
            initialProps: {
                amountAndCurrency: { Amount: 100, Currency: 'USD' },
                onChargeable: onChargeableMock,
            },
        }
    );

    result.current.setCardProperty('number', '4242424242424242');
    result.current.setCardProperty('month', '12');
    result.current.setCardProperty('year', '2032');
    result.current.setCardProperty('cvc', '123');
    result.current.setCardProperty('zip', '12345');
    result.current.setCardProperty('country', 'US');

    await result.current.fetchPaymentToken();
    expect(result.current.paymentProcessor.fetchedPaymentToken).toEqual({
        Amount: 100,
        Currency: 'USD',
        PaymentToken: 'token123',
        v: 5,
        chargeable: true,
        type: 'card',
    });

    rerender({
        amountAndCurrency: { Amount: 200, Currency: 'EUR' },
        onChargeable: onChargeableMock,
    });

    expect(result.current.paymentProcessor.fetchedPaymentToken).toEqual(null);
});

it('should verify the payment token', async () => {
    addTokensResponse().pending();
    mockVerifyPayment.mockResolvedValue({
        PaymentToken: 'token123',
        v: 5,
    });

    const { result } = renderHook(
        (props: Props) => useCard(props, { api: apiMock, verifyPayment: mockVerifyPayment }),
        {
            initialProps: {
                amountAndCurrency: { Amount: 100, Currency: 'USD' },
                onChargeable: onChargeableMock,
            },
        }
    );

    result.current.setCardProperty('number', '4242424242424242');
    result.current.setCardProperty('month', '12');
    result.current.setCardProperty('year', '2032');
    result.current.setCardProperty('cvc', '123');
    result.current.setCardProperty('zip', '12345');
    result.current.setCardProperty('country', 'US');

    await result.current.fetchPaymentToken();

    expect(result.current.paymentProcessor.fetchedPaymentToken).toEqual({
        Amount: 100,
        Currency: 'USD',
        PaymentToken: 'token123',
        v: 5,
        chargeable: false,
        type: 'card',
        status: PAYMENT_TOKEN_STATUS.STATUS_PENDING,
        approvalURL: 'https://verify.proton.me',
        returnHost: 'https://account.proton.me',
    });

    const verifyPromise = result.current.verifyPaymentToken();
    expect(result.current.fetchingToken).toEqual(false);
    expect(result.current.verifyingToken).toEqual(true);
    expect(result.current.processingToken).toEqual(true);

    const verifiedToken = await verifyPromise;
    expect(verifiedToken).toEqual({
        PaymentToken: 'token123',
        v: 5,
        Amount: 100,
        Currency: 'USD',
        chargeable: true,
        type: 'card',
    });
});

it('should throw an error during token processing if verification failed', async () => {
    addTokensResponse().pending();
    mockVerifyPayment.mockRejectedValue(new Error('Verification failed'));

    const { result } = renderHook(
        (props: Props) => useCard(props, { api: apiMock, verifyPayment: mockVerifyPayment }),
        {
            initialProps: {
                amountAndCurrency: { Amount: 100, Currency: 'USD' },
                onChargeable: onChargeableMock,
            },
        }
    );

    result.current.setCardProperty('number', '4242424242424242');
    result.current.setCardProperty('month', '12');
    result.current.setCardProperty('year', '2032');
    result.current.setCardProperty('cvc', '123');
    result.current.setCardProperty('zip', '12345');
    result.current.setCardProperty('country', 'US');

    await result.current.fetchPaymentToken();

    expect(result.current.paymentProcessor.fetchedPaymentToken).toEqual({
        Amount: 100,
        Currency: 'USD',
        PaymentToken: 'token123',
        v: 5,
        chargeable: false,
        type: 'card',
        status: PAYMENT_TOKEN_STATUS.STATUS_PENDING,
        approvalURL: 'https://verify.proton.me',
        returnHost: 'https://account.proton.me',
    });

    const processPromise = result.current.processPaymentToken();
    expect(result.current.fetchingToken).toEqual(false);
    expect(result.current.verifyingToken).toEqual(true);
    expect(result.current.processingToken).toEqual(true);

    await expect(processPromise).rejects.toThrow('Verification failed');
    expect(result.current.fetchingToken).toEqual(false);
    expect(result.current.verifyingToken).toEqual(false);
    expect(result.current.processingToken).toEqual(false);
    expect(result.current.paymentProcessor.fetchedPaymentToken).toEqual(null);
});
