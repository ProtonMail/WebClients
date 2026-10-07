import { PAYMENT_METHOD_TYPES } from '../constants';
import { getSystemByHookType } from './interface';

describe('getSystemByHookType', () => {
    it.each(['paypal', 'card', 'saved', 'bitcoin'] as const)('reports %s as inhouse', (type) => {
        expect(getSystemByHookType(type)).toBe('inhouse');
    });

    it.each(['chargebee-card', 'chargebee-paypal', 'saved-chargebee'] as const)('reports %s as chargebee', (type) => {
        expect(getSystemByHookType(type)).toBe('chargebee');
    });

    // these used to fall through to undefined and reported no system at all in telemetry
    it.each([
        PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
        PAYMENT_METHOD_TYPES.APPLE_PAY,
        PAYMENT_METHOD_TYPES.GOOGLE_PAY,
        PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
    ] as const)('reports %s as chargebee', (type) => {
        expect(getSystemByHookType(type)).toBe('chargebee');
    });

    it('reports chargebee-bitcoin as inhouse, it never uses the Chargebee iframe', () => {
        expect(getSystemByHookType('chargebee-bitcoin')).toBe('inhouse');
    });

    it('passes through n/a and undefined', () => {
        expect(getSystemByHookType('n/a')).toBe('n/a');
        expect(getSystemByHookType(undefined)).toBeUndefined();
    });
});
