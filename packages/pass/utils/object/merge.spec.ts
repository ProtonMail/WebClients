import { merge } from './merge';

describe('merge', () => {
    it('recursively merges an object deeply with another object', () => {
        const original = {
            foo: 'bar',
            baz: {
                qux: 'quux',
            },
        };

        const overwrite = {
            foo: 'baz',
            baz: {
                qux: 'quuz',
            },
        };

        const result = merge(original, overwrite);

        const expected = {
            foo: 'baz',
            baz: {
                qux: 'quuz',
            },
        };

        expect(result).toEqual(expected);
    });

    it('keeps properties that are not defined on the overwriting object intact', () => {
        const original = {
            foo: 'bar',
            baz: 'qux',
            quux: {
                quuz: 'corge',
                grault: 'garply',
            },
        };

        const overwrite = {
            foo: 'baz',
            quux: {
                quuz: 'grault',
            },
        };

        const result = merge(original, overwrite);

        const expected = {
            foo: 'baz',
            baz: 'qux',
            quux: {
                quuz: 'grault',
                grault: 'garply',
            },
        };

        expect(result).toEqual(expected);
    });

    it("keeps reference identify for properties which aren't overwritten by the overwriting object", () => {
        const original = {
            foo: 'bar',
            baz: { qux: 'quux' },
        };

        const overwrite = {
            foo: 'baz',
            qux: { qux: 'quux' },
        };

        const result = merge(original, overwrite);

        expect(result.baz).toBe(original.baz);
    });

    it('returns the original object unmodified should it be identical to the overwriting object', () => {
        const original = {
            foo: 'bar',
            baz: { qux: 'quux' },
        };

        const overwrite = original;

        const result = merge(original, overwrite);

        expect(result).toBe(original);
    });
});
