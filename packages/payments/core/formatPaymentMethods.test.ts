import { Autopay, PAYMENT_METHOD_TYPES } from './constants';
import { formatPaymentMethod, formatPaymentMethods } from './formatPaymentMethods';
import type { SavedPaymentMethod } from './interface';

describe('formatPaymentMethod()', () => {
    it('should normalize a paypal method to CHARGEBEE_PAYPAL', () => {
        const method = {
            ID: '0rvX37nrqhxhCB87AISMcRYQWLa0hLk-0tIKCFtZbpLmamvej3SovOWjyYFoj_CmSplwb_vffWkT9zlG0MgU9Q==',
            Type: 'paypal',
            Autopay: Autopay.ENABLE,

            Order: 500,
            Details: {
                BillingAgreementID: 'B-5AG87924V96420614',
                PayerID: '9A7V38V3A2R7A',
                Payer: 'buyer@protonmail.com',
            },
        } as unknown as SavedPaymentMethod;

        const result = formatPaymentMethod(method);

        expect(result.Type).toBe(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);
    });

    it('should preserve all other fields when normalizing paypal', () => {
        const method = {
            ID: 'paypal-id',
            Type: 'paypal',
            Autopay: Autopay.ENABLE,

            Order: 500,
            Details: {
                BillingAgreementID: 'B-5AG87924V96420614',
                PayerID: '9A7V38V3A2R7A',
                Payer: 'buyer@protonmail.com',
            },
        } as unknown as SavedPaymentMethod;

        const result = formatPaymentMethod(method);

        expect(result).toEqual({
            ID: 'paypal-id',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            Autopay: Autopay.ENABLE,

            Order: 500,
            Details: {
                BillingAgreementID: 'B-5AG87924V96420614',
                PayerID: '9A7V38V3A2R7A',
                Payer: 'buyer@protonmail.com',
            },
        });
    });

    it('should keep an already normalized CHARGEBEE_PAYPAL method as CHARGEBEE_PAYPAL', () => {
        const method = {
            ID: 'paypal-id',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            Details: { BillingAgreementID: 'B-1', PayerID: 'P-1', Payer: 'buyer@protonmail.com' },
        } as unknown as SavedPaymentMethod;

        expect(formatPaymentMethod(method).Type).toBe(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);
    });

    it('should not normalize a paypal method without Details', () => {
        const method = {
            ID: 'paypal-id',
            Type: 'paypal',
        } as unknown as SavedPaymentMethod;

        expect(formatPaymentMethod(method).Type).toBe('paypal');
    });

    it.each(['sepa-direct-debit', 'sepadirectdebit'])(
        'should normalize SEPA type "%s" to CHARGEBEE_SEPA_DIRECT_DEBIT even without Details',
        (type) => {
            const method = { ID: 'sepa-id', Type: type } as unknown as SavedPaymentMethod;

            expect(formatPaymentMethod(method).Type).toBe(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT);
        }
    );

    it('should normalize "sepa_direct_debit" with Details to CHARGEBEE_SEPA_DIRECT_DEBIT', () => {
        const method = {
            ID: 'sepa-id',
            Type: 'sepa_direct_debit',
            Details: { IBAN: 'DE00', AccountName: 'Holder' },
        } as unknown as SavedPaymentMethod;

        expect(formatPaymentMethod(method).Type).toBe(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT);
    });

    it('should not normalize "sepa_direct_debit" without Details', () => {
        const method = { ID: 'sepa-id', Type: 'sepa_direct_debit' } as unknown as SavedPaymentMethod;

        expect(formatPaymentMethod(method).Type).toBe('sepa_direct_debit');
    });

    it.each(['applepay', PAYMENT_METHOD_TYPES.APPLE_PAY])(
        'should normalize Apple Pay type "%s" with Details to APPLE_PAY',
        (type) => {
            const method = {
                ID: 'apple-id',
                Type: type,
                Details: { Last4: '4242' },
            } as unknown as SavedPaymentMethod;

            expect(formatPaymentMethod(method).Type).toBe(PAYMENT_METHOD_TYPES.APPLE_PAY);
        }
    );

    it('should not normalize an Apple Pay method without Details', () => {
        const method = { ID: 'apple-id', Type: 'applepay' } as unknown as SavedPaymentMethod;

        expect(formatPaymentMethod(method).Type).toBe('applepay');
    });

    it.each(['googlepay', PAYMENT_METHOD_TYPES.GOOGLE_PAY])(
        'should normalize Google Pay type "%s" with Details to GOOGLE_PAY',
        (type) => {
            const method = {
                ID: 'google-id',
                Type: type,
                Details: { Last4: '4242' },
            } as unknown as SavedPaymentMethod;

            expect(formatPaymentMethod(method).Type).toBe(PAYMENT_METHOD_TYPES.GOOGLE_PAY);
        }
    );

    it('should not normalize a Google Pay method without Details', () => {
        const method = { ID: 'google-id', Type: 'googlepay' } as unknown as SavedPaymentMethod;

        expect(formatPaymentMethod(method).Type).toBe('googlepay');
    });

    it.each([PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN])(
        'should return a "%s" method unchanged',
        (type) => {
            const method = { ID: 'other-id', Type: type } as unknown as SavedPaymentMethod;

            expect(formatPaymentMethod(method)).toEqual(method);
        }
    );

    it('should normalize a card method to CHARGEBEE_CARD', () => {
        const method = {
            ID: 'Dgh_mKP_sZz-1Q3EIp-EOb5PpFVjuY2ktWUp2cga6ABbQ0LyUDKfBX6BskoQmUwdESsSw13E0sokdabDP6L3WQ==',
            Type: 'card',
            Autopay: Autopay.ENABLE,

            Order: 499,
            Details: {
                Last4: '4242',
                Brand: 'Visa',
                ExpMonth: '01',
                ExpYear: '2033',
                Name: '',
                Country: 'DE',
                ZIP: null,
                ThreeDSSupport: false,
            },
        } as unknown as SavedPaymentMethod;

        expect(formatPaymentMethod(method).Type).toBe(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
    });

    it('should preserve all other fields when normalizing card', () => {
        const method = {
            ID: 'card-id',
            Type: 'card',
            Autopay: Autopay.ENABLE,

            Order: 499,
            Details: {
                Last4: '4242',
                Brand: 'Visa',
                ExpMonth: '01',
                ExpYear: '2033',
                Name: '',
                Country: 'DE',
                ZIP: null,
                ThreeDSSupport: false,
            },
        } as unknown as SavedPaymentMethod;

        const result = formatPaymentMethod(method);

        expect(result).toEqual({
            ID: 'card-id',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            Autopay: Autopay.ENABLE,

            Order: 499,
            Details: {
                Last4: '4242',
                Brand: 'Visa',
                ExpMonth: '01',
                ExpYear: '2033',
                Name: '',
                Country: 'DE',
                ZIP: null,
                ThreeDSSupport: false,
            },
        });
    });

    it('should keep an already normalized CHARGEBEE_CARD method as CHARGEBEE_CARD', () => {
        const method = {
            ID: 'card-id',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            Details: { Last4: '4242', Brand: 'Visa', ExpMonth: '01', ExpYear: '2033' },
        } as unknown as SavedPaymentMethod;

        expect(formatPaymentMethod(method).Type).toBe(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
    });

    it('should not normalize a card method without Details', () => {
        const method = { ID: 'card-id', Type: 'card' } as unknown as SavedPaymentMethod;

        expect(formatPaymentMethod(method).Type).toBe('card');
    });
});

describe('formatPaymentMethods()', () => {
    it('should normalize every method of the list', () => {
        const methods = [
            { ID: 'paypal-id', Type: 'paypal', Details: { BillingAgreementID: 'B-1' } },
            { ID: 'card-id', Type: 'card', Details: { Last4: '1234', ExpMonth: '12', ExpYear: '2030' } },
        ] as unknown as SavedPaymentMethod[];

        expect(formatPaymentMethods(methods).map(({ Type }) => Type)).toEqual([
            PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        ]);
    });

    it('should mark the method with the lowest Order as the default one', () => {
        const methods = [
            { ID: 'second', Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, Order: 501 },
            { ID: 'first', Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, Order: 500 },
        ] as unknown as SavedPaymentMethod[];

        expect(formatPaymentMethods(methods).map(({ ID, IsDefault }) => ({ ID, IsDefault }))).toEqual([
            { ID: 'first', IsDefault: true },
            { ID: 'second', IsDefault: false },
        ]);
    });

    it('should handle an empty list', () => {
        expect(formatPaymentMethods([])).toEqual([]);
    });
});
