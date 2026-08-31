import extractDigits from './extractDigits';

describe('extractDigits()', () => {
    it('returns an empty string when provided an empty string', () => {
        expect(extractDigits('')).toBe('');
    });

    it('keeps a string that only contains digits unchanged', () => {
        expect(extractDigits('1234567890')).toBe('1234567890');
    });

    it('removes all non-digit characters', () => {
        expect(extractDigits('a1b2c3')).toBe('123');
    });

    it('removes letters, spaces and punctuation', () => {
        expect(extractDigits('Phone: (555) 123-4567 ext. 89!')).toBe('555123456789');
    });

    it('removes decimal separators and minus signs', () => {
        expect(extractDigits('-12.34')).toBe('1234');
    });

    it('returns an empty string when no digits are present', () => {
        expect(extractDigits('hello world')).toBe('');
    });

    it('handles a single digit surrounded by non-digits', () => {
        expect(extractDigits('---5---')).toBe('5');
    });
});
