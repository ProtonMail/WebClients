import { getSafeArray, getSafeErrorObject, getSafeObject, getSafeValue } from './getSafeErrorObject';

describe('getSafeValue', () => {
    const error = new Error('blah');

    const testCases = [
        { name: 'number', value: 3, expected: 3 },
        { name: 'string', value: 'abc', expected: 'abc' },
        { name: 'boolean', value: true, expected: true },
        { name: 'null', value: null, expected: null },
        { name: 'undefined', value: undefined, expected: undefined },
        { name: 'array', value: [1, 2, 3], expected: [1, 2, 3] },
        { name: 'array (deep)', value: [1, 2, 3, [4, 5]], expected: [1, 2, 3, [4, 5]] },
        { name: 'object', value: { key: 'value' }, expected: { key: 'value' } },
        {
            name: 'object (deep)',
            value: { key: 'value', other: { stuff: [1, 2, 3] } },
            expected: { key: 'value', other: { stuff: [1, 2, 3] } },
        },
        { name: 'error', value: error, expected: getSafeErrorObject(error) },
        { name: 'unsupported type', value: Symbol('oh no'), expected: undefined },
    ];

    testCases.forEach((testCase) => {
        it(`should accept '${testCase.name}'`, () => {
            expect(getSafeValue(testCase.value)).toStrictEqual(testCase.expected);
        });
    });
});

describe('getSafeErrorObject', () => {
    it(`should accept errors`, () => {
        const value = new Error('blah');
        const expected = { name: 'Error', message: 'blah', cause: undefined };

        const result = getSafeValue(value);

        expect(result).toHaveProperty('stack');
        expect(result).toMatchObject(expected);
    });

    it(`should accept errors with cause`, () => {
        const value = new Error('blah', { cause: { something: true } });
        const expected = { name: 'Error', message: 'blah', cause: { something: true } };

        const result = getSafeValue(value);

        expect(result).toHaveProperty('stack');
        expect(result).toMatchObject(expected);
    });

    it(`should accept errors with nested errors in cause`, () => {
        const value = new Error('blah', { cause: { e: new Error('oh no') } });
        const expected = {
            name: 'Error',
            message: 'blah',
            cause: { e: { name: 'Error', message: 'oh no', cause: undefined } },
        };

        const result = getSafeValue(value);

        expect(result).toHaveProperty('stack');
        expect(result).toHaveProperty('cause.e.stack');
        expect(result).toMatchObject(expected);
    });
});

describe('getSafeObject', () => {
    const testCases = [
        { name: 'object', value: { key: 'value' }, expected: { key: 'value' } },
        {
            name: 'object (deep)',
            value: { key: 'value', other: { stuff: [1, 2, 3] } },
            expected: { key: 'value', other: { stuff: [1, 2, 3] } },
        },
    ];

    testCases.forEach((testCase) => {
        it(`should accept '${testCase.name}'`, () => {
            expect(getSafeObject(testCase.value)).toStrictEqual(testCase.expected);
        });
    });
});

describe('getSafeArray', () => {
    const testCases = [
        { name: 'array', value: [1, 2, 3], expected: [1, 2, 3] },
        { name: 'array (deep)', value: [1, 2, 3, [4, 5]], expected: [1, 2, 3, [4, 5]] },
        { name: 'array (objects)', value: [1, 2, 3, [{ blah: true }]], expected: [1, 2, 3, [{ blah: true }]] },
    ];

    testCases.forEach((testCase) => {
        it(`should accept '${testCase.name}'`, () => {
            expect(getSafeArray(testCase.value)).toStrictEqual(testCase.expected);
        });
    });
});
