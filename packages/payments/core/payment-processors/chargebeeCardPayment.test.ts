import { isPostalCode } from './chargebeeCardPayment';

describe('postal code', () => {
    it('should validate invalid postal code', () => {
        expect(isPostalCode('')).toBe(false);
        expect(isPostalCode('1')).toBe(false);
        expect(isPostalCode('12')).toBe(false);
    });

    it('should validate us postal code', () => {
        expect(isPostalCode('CA95014')).toBe(true);
    });

    it('should validate polish postal code', () => {
        expect(isPostalCode('31-444')).toBe(true);
    });
});
