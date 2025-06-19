import { toValidHtmlId } from '@proton/shared/lib/dom/toValidHtmlId';

describe('toValidHtmlId', () => {
    it('converts uppercase to lowercase', () => {
        expect(toValidHtmlId('HELLO')).toBe('hello');
    });

    it('replaces spaces and special characters with dashes', () => {
        expect(toValidHtmlId('Hello World!')).toBe('hello-world');
    });

    it('removes leading and trailing whitespace and dashes', () => {
        expect(toValidHtmlId('   hello world   ')).toBe('hello-world');
        expect(toValidHtmlId('-hello-')).toBe('hello');
    });

    it('collapses multiple dashes', () => {
        expect(toValidHtmlId('hello--world')).toBe('hello-world');
    });

    it('keeps allowed characters: dash, underscore, colon', () => {
        expect(toValidHtmlId('abc-123_def:ghi')).toBe('abc-123_def:ghi');
    });

    it('replaces / and = with dashes', () => {
        expect(toValidHtmlId('foo/bar=baz')).toBe('foo-bar-baz');
    });

    it('returns empty string if input has no valid characters', () => {
        expect(toValidHtmlId('!@#$%^&*()')).toBe('');
    });
});
