import { PAYMENT_METHOD_TYPES } from '../constants';
import { isCurrencySupportedByMethod } from './methodCurrencies';

describe('isCurrencySupportedByMethod', () => {
    it.each([PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL])(
        'should support EUR but not USD for %s',
        (method) => {
            expect(isCurrencySupportedByMethod(method, 'EUR')).toBe(true);
            expect(isCurrencySupportedByMethod(method, 'USD')).toBe(false);
        }
    );

    it('should support any currency for unrestricted methods', () => {
        expect(isCurrencySupportedByMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, 'USD')).toBe(true);
        expect(isCurrencySupportedByMethod(undefined, 'USD')).toBe(true);
    });
});
