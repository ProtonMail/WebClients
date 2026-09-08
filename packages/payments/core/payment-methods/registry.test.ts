import type { PAYMENT_METHOD_TYPES } from '../constants';
import { isSavablePaymentMethod } from './helpers';
import { type PaymentMethodConfig, paymentMethodRegistry } from './registry';

const rows = Object.entries(paymentMethodRegistry) as [PAYMENT_METHOD_TYPES, PaymentMethodConfig][];

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
});
