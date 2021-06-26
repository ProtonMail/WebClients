import { sanitizeDescription } from './sanitize';

describe('sanitize description', () => {
    test('should drop disallowed tags', () => {
        expect(
            sanitizeDescription(
                `<div><img src="https://protonmail.com" alt="test"/></span><a href="https://protonmail.com">protonmail</a></div>`
            )
        ).toEqual(`<a href="https://protonmail.com" rel="noopener noreferrer" target="_blank">protonmail</a>`);
    });

    test('should drop disallowed attributes', () => {
        expect(sanitizeDescription(`<span style="font-family: sans-serif">text</span>`)).toEqual(`<span>text</span>`);
    });
});
