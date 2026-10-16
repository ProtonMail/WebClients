import { describe, expect, it } from 'vitest';

import { isValidMessageString } from '../isValidMessageString';
import { LUMO_EMOJI_IDS, getLumoEmojiSrc, splitTextIntoLumoEmojiSegments } from './lumoEmojis';

describe('splitTextIntoLumoEmojiSegments', () => {
    it('splits a token out of the surrounding text', () => {
        expect(splitTextIntoLumoEmojiSegments('ok [lumo_emoji:this-is-fine] then')).toEqual([
            { type: 'text', text: 'ok ' },
            { type: 'lumoEmoji', id: 'this-is-fine' },
            { type: 'text', text: ' then' },
        ]);
    });

    it('splits two adjacent tokens without an empty text segment between them', () => {
        expect(splitTextIntoLumoEmojiSegments('[lumo_emoji:cash][lumo_emoji:rocket]')).toEqual([
            { type: 'lumoEmoji', id: 'cash' },
            { type: 'lumoEmoji', id: 'rocket' },
        ]);
    });

    it('keeps a token with an unknown id inside the text', () => {
        expect(splitTextIntoLumoEmojiSegments('a [lumo_emoji:unicorn] b')).toEqual([
            { type: 'text', text: 'a [lumo_emoji:unicorn] b' },
        ]);
    });

    it('keeps a token that names an Object prototype key inside the text', () => {
        expect(splitTextIntoLumoEmojiSegments('[lumo_emoji:constructor] [lumo_emoji:toString]')).toEqual([
            { type: 'text', text: '[lumo_emoji:constructor] [lumo_emoji:toString]' },
        ]);
    });

    it('finds only the complete token when typed text opens another one right before it', () => {
        expect(splitTextIntoLumoEmojiSegments('[lumo_emoji:rock[lumo_emoji:cash]')).toEqual([
            { type: 'text', text: '[lumo_emoji:rock' },
            { type: 'lumoEmoji', id: 'cash' },
        ]);
    });
});

describe('LUMO_EMOJI_IDS', () => {
    it('gives every Lumo emoji a token the receiver accepts, that splits back into it, and its own GIF', () => {
        expect(LUMO_EMOJI_IDS).toContain('this-is-fine');

        for (const id of LUMO_EMOJI_IDS) {
            const token = `[lumo_emoji:${id}]`;

            expect(isValidMessageString(token)).toBe(true);
            expect(splitTextIntoLumoEmojiSegments(token)).toEqual([{ type: 'lumoEmoji', id }]);
            expect(getLumoEmojiSrc(id)).toContain(`/lumo-emojis/${id}.gif`);
        }
    });
});
