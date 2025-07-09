import {
    escape,
    escapeForbiddenStyle,
    escapeURLinStyle,
    recurringUnescapeCSSEncoding,
    unescape,
} from '../../lib/sanitize/escape';

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
            expect(escapeForbiddenStyle('(prefers-color-scheme: dark)')).toBe(
                '(prefers-proton-disabled-Color-scheme: dark)'
            );
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

        it('should correctly unescape CSS encoded /75 issue', () => {
            const input = 'background: \\75\trl(https://attacker.com);';
            const expected = 'background: url(https://attacker.com);';
            expect(recurringUnescapeCSSEncoding(input)).toBe(expected);
        });
    });

    describe('escapeURLinStyle', () => {
        it('should return an empty string when trying to escape ', () => {
            const style = `background
            ur&#x26;#x26;#x26;#x26;#x26;#x26;(https://proton.me/image.jpg);`;

            expect(escapeURLinStyle(style)).toEqual('');
        });

        it('should keep the same style', () => {
            const style = `background
            ur&#x26;#x26;#x26;#x26;#x26;(https://proton.me/image.jpg);`;

            expect(escapeURLinStyle(style)).toEqual(style);
        });
    });

    describe('unescape', () => {
        it('should unescape the string', () => {
            const string = `&lt;Hello&gt;&amp;&quot;&lt;Bye&gt;&#39;`;
            const expected = `<Hello>&"<Bye>'`;

            expect(unescape(string)).toEqual(expected);
        });
    });

    describe('escape', () => {
        it('should escape the string', () => {
            const string = `<Hello>&"<Bye>'`;
            const expected = `&lt;Hello&gt;&amp;&quot;&lt;Bye&gt;&#39;`;

            expect(escape(string)).toEqual(expected);
        });
    });
});
