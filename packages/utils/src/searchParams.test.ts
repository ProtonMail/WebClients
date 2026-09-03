import { getSearchParamString } from './searchParams';

describe('getSearchParamString', () => {
    it('should convert a flat object into a query string', () => {
        expect(getSearchParamString({ foo: 'bar', baz: 'qux' })).toBe('foo=bar&baz=qux');
    });

    it('should keep the value 0', () => {
        expect(getSearchParamString({ page: 0 })).toBe('page=0');
    });

    it('should drop falsy values (null, undefined, false, empty string, NaN)', () => {
        expect(
            getSearchParamString({
                a: null,
                b: undefined,
                c: false,
                d: '',
                e: Number.NaN,
            })
        ).toBe('');
    });

    it('should mix kept and dropped values', () => {
        expect(getSearchParamString({ keep: 'value', zero: 0, dropNull: null, dropFalse: false })).toBe(
            'keep=value&zero=0'
        );
    });

    it('should stringify non-string values', () => {
        expect(getSearchParamString({ num: 123, bool: true })).toBe('num=123&bool=true');
    });

    it('should return an empty string for an empty object', () => {
        expect(getSearchParamString({})).toBe('');
    });

    it('should url-encode values that contain special characters', () => {
        expect(getSearchParamString({ q: 'hello world', amp: 'a&b' })).toBe('q=hello+world&amp=a%26b');
    });

    it('should duplicate the key for each element of an array value', () => {
        expect(getSearchParamString({ id: [1, 2, 3] })).toBe('id=1&id=2&id=3');
    });

    it('should duplicate the key for each element with the repeat strategy', () => {
        expect(getSearchParamString({ id: [1, 2, 3] }, { multiple: 'repeat' })).toBe('id=1&id=2&id=3');
    });

    it('should join array values into a single comma-separated value', () => {
        expect(getSearchParamString({ id: [1, 2, 3] }, { multiple: 'comma-separated' })).toBe('id=1%2C2%2C3');
    });

    it('should serialize array values as a JSON array', () => {
        expect(getSearchParamString({ id: [1, 2, 3] }, { multiple: 'json-array' })).toBe('id=%5B1%2C2%2C3%5D');
    });

    it('should handle a mix of array and scalar values', () => {
        expect(getSearchParamString({ ids: ['a', 'b'], mode: 'sync' })).toBe('ids=a&ids=b&mode=sync');
    });

    it('should handle mixed arrays and scalars with the comma-separated strategy', () => {
        expect(getSearchParamString({ ids: ['a', 'b'], mode: 'sync' }, { multiple: 'comma-separated' })).toBe(
            'ids=a%2Cb&mode=sync'
        );
    });

    it('should drop an empty array value', () => {
        expect(getSearchParamString({ tags: [] })).toBe('');
    });

    it('should serialize object values as JSON', () => {
        expect(getSearchParamString({ simulator: { open: true } })).toBe('simulator=%7B%22open%22%3Atrue%7D');
    });

    it('should url-encode JSON object values', () => {
        expect(getSearchParamString({ filter: { q: 'hello world' } })).toBe('filter=%7B%22q%22%3A%22hello+world%22%7D');
    });

    it('should mix object, array, and scalar values', () => {
        expect(
            getSearchParamString(
                {
                    currency: ['USD', 'EUR'],
                    simulator: { open: true },
                    page: 1,
                },
                { multiple: 'comma-separated' }
            )
        ).toBe('currency=USD%2CEUR&simulator=%7B%22open%22%3Atrue%7D&page=1');
    });

    it('should drop null object values without serializing them', () => {
        expect(getSearchParamString({ simulator: null, page: 1 })).toBe('page=1');
    });

    it('should not treat arrays as JSON objects', () => {
        expect(getSearchParamString({ ids: [1, 2] }, { multiple: 'json-array' })).toBe('ids=%5B1%2C2%5D');
    });
});
