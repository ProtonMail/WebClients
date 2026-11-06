import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { AvailablePaymentMethod, PlainPaymentMethodType } from '@proton/payments/core/interface';

import {
    isSavedChargebeeMethodType,
    resetPaymentProcessors,
    selectPaymentProcessor,
} from './paymentProcessorSelection';

const buildProcessors = () => ({
    saved: { name: 'saved', reset: jest.fn() },
    newMethods: {
        [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: { name: 'card', reset: jest.fn() },
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: { name: 'paypal', reset: jest.fn() },
        [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL]: { name: 'ideal', reset: jest.fn() },
        [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN]: { name: 'bitcoin', reset: jest.fn() },
        [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: { name: 'directDebit', reset: jest.fn() },
        [PAYMENT_METHOD_TYPES.APPLE_PAY]: { name: 'applePay', reset: jest.fn() },
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY]: { name: 'googlePay', reset: jest.fn() },
        [PAYMENT_METHOD_TYPES.CASH]: undefined,
        [PAYMENT_METHOD_TYPES.TOKEN]: undefined,
    } satisfies Record<PlainPaymentMethodType, { name: string; reset: jest.Mock } | undefined>,
});

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

describe('isSavedChargebeeMethodType', () => {
    it('matches the method types the facade hard-coded for the saved Chargebee processor', () => {
        expect(Object.values(PAYMENT_METHOD_TYPES).filter(isSavedChargebeeMethodType).sort()).toEqual(
            [
                PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
                PAYMENT_METHOD_TYPES.APPLE_PAY,
                PAYMENT_METHOD_TYPES.GOOGLE_PAY,
                PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
            ].sort()
        );
    });
});

describe('selectPaymentProcessor', () => {
    it('returns undefined when no method is selected', () => {
        const { saved, newMethods } = buildProcessors();

        expect(selectPaymentProcessor(undefined, saved, newMethods)).toBeUndefined();
    });

    it.each([
        [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, 'card'],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, 'paypal'],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, 'ideal'],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, 'bitcoin'],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, 'directDebit'],
        [PAYMENT_METHOD_TYPES.APPLE_PAY, 'applePay'],
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY, 'googlePay'],
    ])('returns the %s processor for a new method', (type, name) => {
        const { saved, newMethods } = buildProcessors();

        expect(selectPaymentProcessor(newMethod(type), saved, newMethods)?.name).toBe(name);
    });

    it.each([PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.TOKEN])(
        'returns undefined for a new %s method',
        (type) => {
            const { saved, newMethods } = buildProcessors();

            expect(selectPaymentProcessor(newMethod(type), saved, newMethods)).toBeUndefined();
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
        const { saved, newMethods } = buildProcessors();

        expect(selectPaymentProcessor(savedMethod(type), saved, newMethods)).toBe(saved);
    });

    it.each([PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.TOKEN])(
        'returns undefined for a saved %s method',
        (type) => {
            const { saved, newMethods } = buildProcessors();

            expect(selectPaymentProcessor(savedMethod(type), saved, newMethods)).toBeUndefined();
        }
    );
});

describe('resetPaymentProcessors', () => {
    it('resets the saved processor and every new-method processor, including direct debit', () => {
        const { saved, newMethods } = buildProcessors();

        resetPaymentProcessors(saved, newMethods);

        expect(saved.reset).toHaveBeenCalledTimes(1);
        Object.values(newMethods)
            .filter((processor) => processor !== undefined)
            .forEach((processor) => expect(processor.reset).toHaveBeenCalledTimes(1));
        expect(newMethods[PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT].reset).toHaveBeenCalledTimes(1);
    });
});
