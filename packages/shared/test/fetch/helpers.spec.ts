import { createUrl, getDateHeader } from '@proton/shared/lib/fetch/helpers';

describe('fetch helpers', () => {
    describe('createUrl', () => {
        it('should append simple query parameters', () => {
            const url = createUrl('https://example.com/path', { foo: 'bar', baz: 'qux' });
            expect(url.toString()).toBe('https://example.com/path?foo=bar&baz=qux');
        });

        it('should handle array parameters correctly', () => {
            const url = createUrl('https://example.com/path', { tags: ['a', 'b'] });
            expect(url.toString()).toBe('https://example.com/path?tags%5B%5D=a&tags%5B%5D=b');
        });

        it('should handle array parameters with array key correctly', () => {
            const url = createUrl('https://example.com/path', { 'tags[]': ['a', 'b'] });
            expect(url.toString()).toBe('https://example.com/path?tags%5B%5D=a&tags%5B%5D=b');
        });

        it('should skip undefined parameters', () => {
            const url = createUrl('https://example.com/path', { foo: undefined, bar: 'baz' });
            expect(url.toString()).toBe('https://example.com/path?bar=baz');
        });

        it('should support relative URLs with origin', () => {
            const url = createUrl('/page', { q: 'test' }, 'https://example.com');
            expect(url.toString()).toBe('https://example.com/page?q=test');
        });

        it('should return the url unmodified', () => {
            const url = createUrl('https://example.com/path');
            expect(url.toString()).toBe('https://example.com/path');
        });
    });

    describe('getDateHeader', () => {
        it('should return a valid Date if the date header is valid', () => {
            const headers = new Headers({ date: 'Wed, 26 Jun 2024 12:00:00 GMT' });
            const result = getDateHeader(headers);
            expect(result).toBeInstanceOf(Date);
            expect(result?.toISOString()).toBe('2024-06-26T12:00:00.000Z');
        });

        it('should return undefined if date header is missing', () => {
            const headers = new Headers();
            expect(getDateHeader(headers)).toBeUndefined();
        });

        it('should return undefined if date header is invalid', () => {
            const headers = new Headers({ date: 'invalid-date' });
            expect(getDateHeader(headers)).toBeUndefined();
        });
    });
});
