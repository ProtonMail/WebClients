import { escapeForbiddenStyle, recurringUnescapeCSSEncoding } from '../../lib/sanitize/escape';

describe('Escape', () => {
    describe('escapeForbiddenStyles', () => {
        it('Should replace absolute styles by relative', () => {
            expect(escapeForbiddenStyle('position: absolute')).toBe('position: relative');
        });

        it('Should replace percentage height by unset', () => {
            expect(escapeForbiddenStyle('height: 100%; min-height: 30% ; max-height:  50%;')).toBe(
                'height: unset; min-height: unset ; max-height:  50%;'
            );
        });

        it('Should not replace percent line-height by unset', () => {
            expect(escapeForbiddenStyle('line-height: 100%;')).toBe('line-height: 100%;');
        });

        it('Should disable dark styles Color schemes', () => {
            expect(escapeForbiddenStyle('Color-scheme: light dark;')).toBe('proton-disabled-Color-scheme: light dark;');
        });

        it('Should disable dark styles media queries', () => {
            expect(escapeForbiddenStyle('(prefers-color-scheme: dark)')).toBe('(prefers-color-scheme: never)');
        });
    });

    describe('recurringUnescapeCSSEncoding', () => {
        it('should return the expected unescaped CSS string when there is few escapes', () => {
            const string = `background
            ur&#x26;#x26;#x26;#x26;#x26;(https://proton.me/image.jpg);`;
            const expectedString = `background
            ur&(https://proton.me/image.jpg);`;

            expect(recurringUnescapeCSSEncoding(string)).toEqual(expectedString);
        });

        it('should return an empty string when trying to unescape CSS a content with too much escapes', () => {
            const string = `background
            ur&#x26;#x26;#x26;#x26;#x26;#x26;(https://proton.me/image.jpg);`;
            const expectedString = ``;

            expect(recurringUnescapeCSSEncoding(string)).toEqual(expectedString);
        });
    });
});
