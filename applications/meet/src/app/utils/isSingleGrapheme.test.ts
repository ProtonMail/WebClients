import { describe, expect, it } from 'vitest';

import { isSingleGrapheme } from './isSingleGrapheme';

describe('isSingleGrapheme', () => {
    it.each([
        ['a single code point emoji', '😀'],
        ['an emoji with a variation selector', '❤️'],
        ['a regional indicator flag', '🇺🇸'],
        ['a tag sequence flag', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'],
        ['a zero-width joiner sequence', '🧑‍🚀'],
        ['a four person family', '👨‍👩‍👧‍👦'],
        ['an emoji with a skin tone', '👍🏽'],
    ])('accepts %s', (_, value) => {
        expect(isSingleGrapheme(value)).toBe(true);
    });

    it.each([
        ['an empty string', ''],
        ['two emojis', '😀😀'],
        ['two flags', '🇺🇸🇫🇷'],
        ['text', 'ab'],
        ['an emoji followed by text', '😀a'],
    ])('refuses %s', (_, value) => {
        expect(isSingleGrapheme(value)).toBe(false);
    });
});
