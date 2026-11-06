import { PAYMENT_METHOD_TYPES } from '../constants';
import { isDirectDebitPaymentMethod, isSavablePaymentMethod, isSavedChargebeePaymentMethod } from './helpers';
import { type PaymentMethodConfig, paymentMethodRegistry } from './registry';

const rows = Object.entries(paymentMethodRegistry) as [PAYMENT_METHOD_TYPES, PaymentMethodConfig][];

const savedChargebeeMethods = {
    [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: true,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: true,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL]: true,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: true,
    [PAYMENT_METHOD_TYPES.APPLE_PAY]: true,
    [PAYMENT_METHOD_TYPES.GOOGLE_PAY]: true,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN]: false,
    [PAYMENT_METHOD_TYPES.CASH]: false,
    [PAYMENT_METHOD_TYPES.TOKEN]: false,
} satisfies Record<PAYMENT_METHOD_TYPES, boolean>;

/**
 * Row completeness and key/name validity are already enforced by `satisfies` on the registry, so
 * these cover only what the type system cannot.
 */
describe('payment method registry', () => {
    it('gives every method a distinct telemetry name', () => {
        const names = rows.map(([, config]) => config.telemetryName);
        expect(new Set(names).size).toBe(names.length);
    });

    // getUsedMethods hides any saved method whose vendor state it cannot look up
    it.each(rows.filter(([, config]) => config.savable))('savable method %s declares a vendor state key', (_, config) =>
        expect(config.vendorStateKey).toBeDefined()
    );

    it('is what isSavablePaymentMethod reads', () => {
        rows.forEach(([type, config]) => expect(isSavablePaymentMethod(type)).toBe(config.savable));
    });

    it('marks exactly SEPA and iDEAL as direct debit', () => {
        const directDebitTypes = rows.map(([type]) => type).filter(isDirectDebitPaymentMethod);
        expect(new Set(directDebitTypes)).toEqual(
            new Set([PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL])
        );
    });

    it.each(Object.values(PAYMENT_METHOD_TYPES))(
        'isSavedChargebeePaymentMethod(%s) matches the saved Chargebee methods',
        (type) => expect(isSavedChargebeePaymentMethod(type)).toBe(savedChargebeeMethods[type])
    );
});
