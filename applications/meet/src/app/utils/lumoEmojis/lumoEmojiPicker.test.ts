import data from '@emoji-mart/data';
import { SearchIndex, init } from 'emoji-mart';
import { describe, expect, it, vi } from 'vitest';

import { getLumoEmojiPickerOptions } from './lumoEmojiPicker';

const openPicker = () => init({ data, ...getLumoEmojiPickerOptions(vi.fn()) });

const searchIds = async (query: string) => {
    const results: { id: string }[] = await SearchIndex.search(query);

    return results.map(({ id }) => id);
};

describe('getLumoEmojiPickerOptions', () => {
    it('hands the native character of a native emoji to the callback', () => {
        const onSelectText = vi.fn();

        getLumoEmojiPickerOptions(onSelectText).onEmojiSelect({ id: 'rocket', native: '🚀' });

        expect(onSelectText).toHaveBeenCalledWith('🚀');
    });

    it('hands the token of a Lumo emoji to the callback', () => {
        const onSelectText = vi.fn();

        getLumoEmojiPickerOptions(onSelectText).onEmojiSelect({ id: 'lumo-rocket' });

        expect(onSelectText).toHaveBeenCalledWith('[lumo_emoji:rocket]');
    });

    it('finds Lumo emojis by their English name', async () => {
        await openPicker();

        expect(await searchIds('this is fine')).toEqual(['lumo-this-is-fine']);
        expect(await searchIds('chefs kiss')).toEqual(['lumo-chefs-kiss']);
    });

    it('keeps the native rocket next to the Lumo rocket', async () => {
        await openPicker();

        expect(await searchIds('rocket')).toEqual(expect.arrayContaining(['rocket', 'lumo-rocket']));
    });

    it('still finds Lumo emojis when the first search happens after the picker opened twice', async () => {
        SearchIndex.reset();

        await openPicker();
        await openPicker();

        expect(await searchIds('chefs kiss')).toEqual(['lumo-chefs-kiss']);
    });
});
