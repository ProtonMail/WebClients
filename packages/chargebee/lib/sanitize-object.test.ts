import { sanitizeObject } from './sanitize-object';

type TestShape = {
    foo: string;
    bar: number;
};

describe('sanitizeObject', () => {
    it('returns an empty object for an empty input', () => {
        expect(sanitizeObject<TestShape>({}, new Set(['foo', 'bar']))).toEqual({});
    });

    it('keeps only the allowed keys', () => {
        const result = sanitizeObject<TestShape>(
            {
                foo: 'hello',
                bar: 1,
                baz: 'should-be-dropped',
                qux: true,
            },
            new Set(['foo', 'bar'])
        );

        expect(result).toEqual({
            foo: 'hello',
            bar: 1,
        });
    });

    it('drops disallowed keys while preserving values of allowed ones', () => {
        const result = sanitizeObject<TestShape>({ bar: 42, nope: 'ignored' }, new Set(['bar']));

        expect(Object.keys(result)).toEqual(['bar']);
        expect(result.bar).toBe(42);
    });

    it('returns an empty object when no keys are allowed', () => {
        expect(sanitizeObject<TestShape>({ foo: 'a', bar: 2 }, new Set())).toEqual({});
    });

    it('preserves every allowed key untouched', () => {
        const result = sanitizeObject<TestShape>(
            {
                foo: 'abc',
                bar: 7,
            },
            new Set(['foo', 'bar'])
        );

        expect(result).toEqual({
            foo: 'abc',
            bar: 7,
        });
    });
});
