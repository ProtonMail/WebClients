import { restrictedCalendarSanitize } from './sanitize';

describe('sanitize description', () => {
    it('should drop disallowed tags', () => {
        expect(
            restrictedCalendarSanitize(
                `<div><img src="https://protonmail.com" alt="test"/></span><a href="https://protonmail.com">protonmail</a></div>`
            )
        ).toEqual(`<a href="https://protonmail.com" rel="noopener noreferrer" target="_blank">protonmail</a>`);
    });

    it('should drop disallowed attributes', () => {
        expect(restrictedCalendarSanitize(`<span style="font-family: sans-serif">text</span>`)).toEqual(
            `<span>text</span>`
        );
    });
});
