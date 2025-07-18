import { normalizePostalCode } from './format';

describe('normalizePostalCode', () => {
    describe('Canadian postal codes (CA)', () => {
        it('should normalize valid 6-character postal codes without spaces', () => {
            expect(normalizePostalCode('M5H2N2', 'CA')).toBe('M5H 2N2');
            expect(normalizePostalCode('T5J2R7', 'CA')).toBe('T5J 2R7');
            expect(normalizePostalCode('V8W1P6', 'CA')).toBe('V8W 1P6');
            expect(normalizePostalCode('G1R4S9', 'CA')).toBe('G1R 4S9');
        });

        it('should normalize postal codes with mixed case', () => {
            expect(normalizePostalCode('m5h2n2', 'CA')).toBe('M5H 2N2');
            expect(normalizePostalCode('t5j2r7', 'CA')).toBe('T5J 2R7');
            expect(normalizePostalCode('MiXeD1', 'CA')).toBe('MIX ED1');
        });

        it('should remove non-alphanumeric characters and normalize', () => {
            expect(normalizePostalCode('M5H-2N2', 'CA')).toBe('M5H 2N2');
            expect(normalizePostalCode('T5J.2R7', 'CA')).toBe('T5J 2R7');
            expect(normalizePostalCode('V8W_1P6', 'CA')).toBe('V8W 1P6');
            expect(normalizePostalCode('G1R@4S9', 'CA')).toBe('G1R 4S9');
            expect(normalizePostalCode('M5H#2N2!', 'CA')).toBe('M5H 2N2');
        });

        it('should handle multiple spaces and special characters', () => {
            expect(normalizePostalCode('M5H  2N2', 'CA')).toBe('M5H 2N2');
            expect(normalizePostalCode(' M5H 2N2 ', 'CA')).toBe('M5H 2N2');
            expect(normalizePostalCode('M-5-H-2-N-2', 'CA')).toBe('M5H 2N2');
        });

        it('should preserve already properly formatted postal codes', () => {
            expect(normalizePostalCode('M5H 2N2', 'CA')).toBe('M5H 2N2');
            expect(normalizePostalCode('T5J 2R7', 'CA')).toBe('T5J 2R7');
        });

        it('should handle postal codes that are not exactly 6 characters', () => {
            expect(normalizePostalCode('M5H2N', 'CA')).toBe('M5H2N');
            expect(normalizePostalCode('M5H2N22', 'CA')).toBe('M5H2N22');
            expect(normalizePostalCode('M', 'CA')).toBe('M');
            expect(normalizePostalCode('', 'CA')).toBe('');
        });

        it('should handle postal codes with extra characters that result in non-6 length', () => {
            expect(normalizePostalCode('M5H2N2X', 'CA')).toBe('M5H2N2X');
            expect(normalizePostalCode('M5H2', 'CA')).toBe('M5H2');
        });

        it('should trim whitespace for non-6 character postal codes', () => {
            expect(normalizePostalCode('  M5H2N  ', 'CA')).toBe('M5H2N');
            expect(normalizePostalCode('  M5H2N2X  ', 'CA')).toBe('M5H2N2X');
        });
    });

    describe('Non-Canadian postal codes', () => {
        it('should return US postal codes unchanged', () => {
            expect(normalizePostalCode('12345', 'US')).toBe('12345');
            expect(normalizePostalCode('12345-6789', 'US')).toBe('12345-6789');
            expect(normalizePostalCode('90210', 'US')).toBe('90210');
        });

        it('should not return UK postal codes', () => {
            expect(normalizePostalCode('SW1A 1AA', 'GB')).toBe(null);
            expect(normalizePostalCode('M1 1AA', 'GB')).toBe(null);
            expect(normalizePostalCode('B33 8TH', 'GB')).toBe(null);
        });

        it('should not return other country postal codes', () => {
            expect(normalizePostalCode('75001', 'FR')).toBe(null);
            expect(normalizePostalCode('10115', 'DE')).toBe(null);
            expect(normalizePostalCode('00144', 'IT')).toBe(null);
            expect(normalizePostalCode('1000', 'BE')).toBe(null);
        });

        it('should handle undefined/null country codes', () => {
            expect(normalizePostalCode('12345', undefined as any)).toBe(null);
            expect(normalizePostalCode('12345', null as any)).toBe(null);
        });
    });

    describe('Edge cases', () => {
        it('should handle empty postal codes', () => {
            expect(normalizePostalCode('', 'CA')).toBe('');
            expect(normalizePostalCode('', 'US')).toBe('');
        });

        it('should handle whitespace-only postal codes', () => {
            expect(normalizePostalCode('   ', 'CA')).toBe('');
            expect(normalizePostalCode('   ', 'US')).toBe('');
        });

        it('should handle special characters only for Canadian postal codes', () => {
            expect(normalizePostalCode('!@#$%^', 'CA')).toBe('!@#$%^'); // Returns original when can't normalize
            expect(normalizePostalCode('!@#$%^', 'US')).toBe('!@#$%^');
        });

        it('should handle numeric-only Canadian postal codes', () => {
            expect(normalizePostalCode('123456', 'CA')).toBe('123 456');
            expect(normalizePostalCode('123456', 'US')).toBe('123456');
        });

        it('should handle alphabetic-only Canadian postal codes', () => {
            expect(normalizePostalCode('ABCDEF', 'CA')).toBe('ABC DEF');
            expect(normalizePostalCode('ABCDEF', 'US')).toBe('ABCDEF');
        });
    });

    describe('Country code variations', () => {
        it('should handle lowercase country codes', () => {
            expect(normalizePostalCode('M5H2N2', 'CA')).toBe('M5H 2N2');
            expect(normalizePostalCode('M5H2N2', 'us')).toBe('M5H2N2');
        });

        it('should be case-sensitive for country codes', () => {
            expect(normalizePostalCode('M5H2N2', 'Ca')).toBe('M5H 2N2');
            expect(normalizePostalCode('M5H2N2', 'cA')).toBe('M5H 2N2');
        });
    });
});
