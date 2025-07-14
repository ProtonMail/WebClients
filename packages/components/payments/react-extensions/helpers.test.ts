import { isChargebeePaymentProcessor } from './helpers';

describe('isChargebeePaymentProcessor', () => {
    it.each([
        {
            type: 'chargebee-card' as const,
            expected: true,
        },
        {
            type: 'chargebee-paypal' as const,
            expected: true,
        },
        {
            type: 'saved-chargebee' as const,
            expected: true,
        },
        {
            type: 'chargebee-bitcoin' as const,
            expected: true,
        },
        {
            type: 'paypal' as const,
            expected: false,
        },
        {
            type: 'card' as const,
            expected: false,
        },
        {
            type: 'saved' as const,
            expected: false,
        },
        {
            type: 'bitcoin' as const,
            expected: false,
        },
        {
            type: undefined,
            expected: false,
        },
    ])('should return $expected for $type', ({ type, expected }) => {
        expect(isChargebeePaymentProcessor(type)).toBe(expected);
    });
});
