import isEnumValue from './isEnumValue';

describe('isEnumValue()', () => {
    it('returns false if enum object is empty', () => {
        enum Enum {}
        const value = 'value';

        const result = isEnumValue(value, Enum);

        expect(result).toBe(false);
    });

    it('returns false if value is not contained in the enum', () => {
        enum Enum {
            Hello = 'There',
        }
        const value = 'value';

        const result = isEnumValue(value, Enum);

        expect(result).toBe(false);
    });

    it('returns true if value is contained in the enum', () => {
        enum Enum {
            Hello = 'There',
        }
        const value = 'There';

        const result = isEnumValue(value, Enum);

        expect(result).toBe(true);
    });
});