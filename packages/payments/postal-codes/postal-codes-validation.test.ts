import { isPostalCodeValid } from './postal-codes-validation';

describe('zip-regex', () => {
    it('should check ZIP code', () => {
        expect(isPostalCodeValid('US', 'AA', '34000')).toBe(true);
        expect(isPostalCodeValid('US', 'AA', '34000-1234')).toBe(true);
        expect(isPostalCodeValid('US', 'AA', '33333')).toBe(false);
        expect(isPostalCodeValid('US', 'AA', '3333')).toBe(false);
    });

    it('should validate Canadian postal codes', () => {
        // Valid Canadian postal codes (with and without spaces)
        expect(isPostalCodeValid('CA', 'ON', 'M5H 2N2')).toBe(true);
        expect(isPostalCodeValid('CA', 'ON', 'M5H2N2')).toBe(true);
        expect(isPostalCodeValid('CA', 'AB', 'T5J 2R7')).toBe(true);
        expect(isPostalCodeValid('CA', 'AB', 'T5J2R7')).toBe(true);
        expect(isPostalCodeValid('CA', 'BC', 'V8W 1P6')).toBe(true);
        expect(isPostalCodeValid('CA', 'QC', 'G1R4S9')).toBe(true);

        // Valid with hyphens (common user input)
        expect(isPostalCodeValid('CA', 'ON', 'M5H-2N2')).toBe(true);
        expect(isPostalCodeValid('CA', 'AB', 'T5J-2R7')).toBe(true);

        // Valid with dots (less common but occurs)
        expect(isPostalCodeValid('CA', 'BC', 'V8W.1P6')).toBe(true);

        // Valid with multiple/extra spaces
        expect(isPostalCodeValid('CA', 'QC', 'G1R  4S9')).toBe(true);

        // Invalid format
        expect(isPostalCodeValid('CA', 'ON', '12345')).toBe(false); // US format
        expect(isPostalCodeValid('CA', 'ON', 'M5H 2N')).toBe(false); // Too short
        expect(isPostalCodeValid('CA', 'ON', 'M5H 2N22')).toBe(false); // Too long
        expect(isPostalCodeValid('CA', 'ON', '123456')).toBe(false); // All digits
        expect(isPostalCodeValid('CA', 'ON', 'ABCDEF')).toBe(false); // All letters
        expect(isPostalCodeValid('CA', 'ON', 'M55 2N2')).toBe(false); // Wrong pattern
    });
});
