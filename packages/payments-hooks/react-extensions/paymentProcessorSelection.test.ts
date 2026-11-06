import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { AvailablePaymentMethod, PlainPaymentMethodType } from '@proton/payments/core/interface';
import type { PaymentProcessorHook, PaymentProcessorType } from '@proton/payments/core/payment-processors/interface';

import { selectPaymentProcessor } from './paymentProcessorSelection';

const processor = (type: PaymentProcessorType): PaymentProcessorHook => ({
    fetchPaymentToken: jest.fn(),
    fetchingToken: false,
    verifyPaymentToken: jest.fn(),
    verifyingToken: false,
    processPaymentToken: jest.fn(),
    processingToken: false,
    reset: jest.fn(),
    userInitiatedProcessing: false,
    meta: { type },
});

const savedProcessor = processor('saved-chargebee');

const newMethodProcessors: Record<PlainPaymentMethodType, PaymentProcessorHook | undefined> = {
    [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: processor('chargebee-card'),
    [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: processor('chargebee-paypal'),
    [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL]: processor(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL),
    [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN]: processor('chargebee-bitcoin'),
    [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: processor(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT),
    [PAYMENT_METHOD_TYPES.APPLE_PAY]: processor(PAYMENT_METHOD_TYPES.APPLE_PAY),
    [PAYMENT_METHOD_TYPES.GOOGLE_PAY]: processor(PAYMENT_METHOD_TYPES.GOOGLE_PAY),
    [PAYMENT_METHOD_TYPES.CASH]: undefined,
    [PAYMENT_METHOD_TYPES.TOKEN]: undefined,
};

const newMethod = (type: PAYMENT_METHOD_TYPES): AvailablePaymentMethod => ({
    type,
    value: type,
    isSaved: false,
    isDefault: false,
});

const savedMethod = (type: PAYMENT_METHOD_TYPES): AvailablePaymentMethod => ({
    type,
    value: 'saved-method-id',
    paymentMethodId: 'saved-method-id',
    isSaved: true,
    isDefault: false,
});

describe('selectPaymentProcessor', () => {
    it('returns undefined when no method is selected', () => {
        expect(selectPaymentProcessor(undefined, savedProcessor, newMethodProcessors)).toBeUndefined();
    });

    it.each([
        PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
        PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
        PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
        PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
        PAYMENT_METHOD_TYPES.APPLE_PAY,
        PAYMENT_METHOD_TYPES.GOOGLE_PAY,
    ])('returns the processor mapped to a new %s method', (type) => {
        expect(selectPaymentProcessor(newMethod(type), savedProcessor, newMethodProcessors)).toBe(
            newMethodProcessors[type]
        );
    });

    it.each([PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.TOKEN])(
        'returns undefined for a new %s method, which has no processor',
        (type) => {
            expect(selectPaymentProcessor(newMethod(type), savedProcessor, newMethodProcessors)).toBeUndefined();
        }
    );

    it.each([
        PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
        PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
        PAYMENT_METHOD_TYPES.APPLE_PAY,
        PAYMENT_METHOD_TYPES.GOOGLE_PAY,
        PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
    ])('returns the saved Chargebee processor for a saved %s method', (type) => {
        expect(selectPaymentProcessor(savedMethod(type), savedProcessor, newMethodProcessors)).toBe(savedProcessor);
    });

    it.each([PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.TOKEN])(
        'returns undefined for a saved %s method',
        (type) => {
            expect(selectPaymentProcessor(savedMethod(type), savedProcessor, newMethodProcessors)).toBeUndefined();
        }
    );
});
