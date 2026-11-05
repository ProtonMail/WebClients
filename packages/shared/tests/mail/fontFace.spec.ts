import { FONT_FACES } from '../../lib/mail/fontFace';

const GENERIC_FAMILIES = ['serif', 'sans-serif', 'monospace'];

describe('FONT_FACES', () => {
    it.each(Object.values(FONT_FACES))('$label ends with a generic family', ({ value }) => {
        const lastFamily = value.split(',').at(-1)?.trim().toLowerCase();

        expect(GENERIC_FAMILIES).toContain(lastFamily);
    });
});
