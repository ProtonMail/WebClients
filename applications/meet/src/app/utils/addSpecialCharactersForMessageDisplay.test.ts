import { escape } from '@proton/sanitize/escape';

import { addSpecialCharactersForMessageDisplay } from './addSpecialCharactersForMessageDisplay';

describe('addSpecialCharactersForMessageDisplay', () => {
    it('should decode escaped entities back to their characters', () => {
        expect(addSpecialCharactersForMessageDisplay('&lt;test')).toBe('<test');
        expect(addSpecialCharactersForMessageDisplay('a &lt; b &amp;&amp; c &gt; d')).toBe('a < b && c > d');
    });

    it('should decode only once so a literally received &lt; survives', () => {
        expect(addSpecialCharactersForMessageDisplay('&amp;lt;')).toBe('&lt;');
        expect(addSpecialCharactersForMessageDisplay('&amp;amp;')).toBe('&amp;');
    });
});

describe('escape + addSpecialCharactersForMessageDisplay round-trip', () => {
    it('should store an incoming message inert and decode it back to the received text', () => {
        const inputs = [
            'Hello world',
            '<test',
            'a < b && c > d',
            `quotes " and '`,
            '<b>bold</b>',
            '<img src=x onerror=alert(1)>',
            '<script>alert(1)</script>',
            '&lt;',
            '&amp;lt;',
            '&quot;quoted&quot;',
        ];

        for (const input of inputs) {
            expect(addSpecialCharactersForMessageDisplay(escape(input))).toBe(input);
        }
    });
});
