import { objectFilterKV, objectFilterV, objectMapKV, objectMapV } from './objects';

describe('objects utility functions', () => {
    const testObj = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
    };

    describe('objectMapKV', () => {
        it('should map keys and values correctly', () => {
            const result = objectMapKV(
                testObj,
                (key, value) => value.toUpperCase(),
                (key) => `${key}_mapped`
            );

            expect(result).toEqual({
                key1_mapped: 'VALUE1',
                key2_mapped: 'VALUE2',
                key3_mapped: 'VALUE3',
            });
        });

        it('should use original keys when mapK is not provided', () => {
            const result = objectMapKV(testObj, (key, value) => value.toUpperCase());

            expect(result).toEqual({
                key1: 'VALUE1',
                key2: 'VALUE2',
                key3: 'VALUE3',
            });
        });
    });

    describe('objectMapV', () => {
        it('should map values while preserving keys', () => {
            const result = objectMapV(testObj, (value) => value.toUpperCase());

            expect(result).toEqual({
                key1: 'VALUE1',
                key2: 'VALUE2',
                key3: 'VALUE3',
            });
        });
    });

    describe('objectFilterKV', () => {
        it('should filter object entries based on key and value', () => {
            const result = objectFilterKV(testObj, (key, value) => key === 'key1' || value === 'value3');

            expect(result).toEqual({
                key1: 'value1',
                key3: 'value3',
            });
        });

        it('should return empty object when no entries match the filter', () => {
            const result = objectFilterKV(testObj, () => false);

            expect(result).toEqual({});
        });

        it('should return provided empty value when no entries match', () => {
            const emptyValue = { placeholder: true };
            const result = objectFilterKV(testObj, () => false, emptyValue as any);

            expect(result).toBe(emptyValue);
        });

        it('should return provided empty value when object is empty', () => {
            const emptyValue = { placeholder: true };
            const result = objectFilterKV({}, () => true, emptyValue as any);

            expect(result).toBe(emptyValue);
        });
    });

    describe('objectFilterV', () => {
        it('should filter object entries based on value', () => {
            const result = objectFilterV(testObj, (value) => value === 'value1' || value === 'value2');

            expect(result).toEqual({
                key1: 'value1',
                key2: 'value2',
            });
        });

        it('should return empty object when no values match the filter', () => {
            const result = objectFilterV(testObj, () => false);

            expect(result).toEqual({});
        });

        it('should return provided empty value when no entries match', () => {
            const emptyValue = { placeholder: true };
            const result = objectFilterV(testObj, () => false, emptyValue as any);

            expect(result).toBe(emptyValue);
        });
    });
});
