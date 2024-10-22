import { renderHook } from '@testing-library/react';

import { Autopay, type ChargebeeIframeEvents, PAYMENT_METHOD_TYPES, type SavedPaymentMethod } from '@proton/payments';
import { apiMock } from '@proton/testing/index';

import { getMockedIframeHandles, mockPostV5Token } from './__mocks__/mock-helpers';
import { type Dependencies, type Props, useSavedChargebeeMethod } from './useSavedChargebeeMethod';

beforeEach(() => {
    jest.clearAllMocks();
});

const mockSavedMethod: SavedPaymentMethod = {
    ID: 'saved-method-id',
    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
    Details: {
        Last4: '1234',
        Brand: 'visa',
        ExpMonth: '12',
        ExpYear: '2025',
        ZIP: '12345',
        Country: 'US',
    },
    Order: 500,
    Autopay: Autopay.ENABLE,
};

const setupHook = (props: Partial<Props> = {}, dependenciesProps: Partial<Dependencies> = {}) => {
    const defaultProps: Props = {
        amountAndCurrency: {
            Amount: 500,
            Currency: 'EUR',
        },
        savedMethod: mockSavedMethod,
        onChargeable: jest.fn(),
        onProcessPaymentToken: jest.fn(),
        onProcessPaymentTokenFailed: jest.fn(),
    };

    const handles = getMockedIframeHandles();
    handles.validateSavedCreditCard = jest.fn().mockResolvedValue({
        data: {
            authorized: true,
            authorizedPaymentIntent: {
                payment_method_type: 'card',
            },
        },
    });

    const dependencies: Dependencies = {
        api: apiMock,
        events: {
            onCardVeririfcation3dsChallenge: jest.fn().mockReturnValue(jest.fn()),
        } as unknown as ChargebeeIframeEvents,
        handles,
        verifyPayment: jest.fn(),
        ...dependenciesProps,
    };

    return renderHook(() => useSavedChargebeeMethod({ ...defaultProps, ...props }, dependencies));
};

describe('useSavedChargebeeMethod', () => {
    it('should render', () => {
        const { result } = setupHook();
        expect(result.current).toBeDefined();
    });

    it('should fetch payment token', async () => {
        const { result } = setupHook();

        mockPostV5Token({});
        const promise = result.current.fetchPaymentToken();

        await promise;

        expect(result.current.fetchingToken).toBe(false);
        expect(result.current.paymentProcessor?.fetchedPaymentToken).toEqual({
            Amount: 500,
            Currency: 'EUR',
            PaymentToken: 'token',
            v: 5,
            chargeable: true,
            authorized: true,
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        });
    });

    it('should not request payment token if onBeforeSepaPayment returns false', async () => {
        const onBeforeSepaPayment = jest.fn().mockResolvedValue(false);
        const { result } = setupHook({
            savedMethod: {
                ...mockSavedMethod,
                Type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                Details: {
                    AccountName: '123',
                    Country: 'US',
                    Last4: '1234',
                },
            },
            onBeforeSepaPayment,
        });

        const promise = result.current.fetchPaymentToken();
        await promise;

        expect(onBeforeSepaPayment).toHaveBeenCalled();
        expect(result.current.fetchingToken).toBe(false);
        expect(result.current.paymentProcessor?.fetchedPaymentToken).toBe(null);
    });

    it('should verify payment token', async () => {
        const { result } = setupHook();

        mockPostV5Token({});
        await result.current.fetchPaymentToken();

        const verifyPayment = jest.fn().mockResolvedValue({
            PaymentToken: 'verified-token',
            v: 5,
        });

        result.current.paymentProcessor!.verifyPayment = verifyPayment;

        const verifiedToken = await result.current.verifyPaymentToken();

        expect(verifyPayment).toHaveBeenCalled();
        expect(verifiedToken).toEqual({
            Amount: 500,
            Currency: 'EUR',
            PaymentToken: 'verified-token',
            v: 5,
            chargeable: true,
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        });
    });

    it('should process payment token', async () => {
        const onProcessPaymentToken = jest.fn();
        const { result } = setupHook({ onProcessPaymentToken });

        mockPostV5Token({});
        const processPaymentToken = result.current.processPaymentToken();

        await processPaymentToken;

        expect(onProcessPaymentToken).toHaveBeenCalledWith('saved-chargebee');
        expect(result.current.paymentProcessor?.fetchedPaymentToken).toBeDefined();
    });

    it('should call onProcessPaymentTokenFailed if processing fails', async () => {
        const onProcessPaymentTokenFailed = jest.fn();
        const { result } = setupHook(
            {
                onProcessPaymentTokenFailed,
            },
            {
                verifyPayment: jest.fn().mockRejectedValue(new Error('Verification failed')),
            }
        );

        mockPostV5Token({});

        await expect(result.current.processPaymentToken()).rejects.toThrow('Verification failed');

        expect(onProcessPaymentTokenFailed).toHaveBeenCalledWith('saved-chargebee');
        expect(result.current.paymentProcessor?.fetchedPaymentToken).toBe(null);
    });
});
