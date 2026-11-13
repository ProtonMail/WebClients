import data from '@emoji-mart/data';
import { SearchIndex, init } from 'emoji-mart';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLumoEmojiPickerOptions } from './lumoEmojiPicker';

const composerSettings = { isLumoEmojisEnabled: true, showLumoSection: true };
const reactionSettings = { isLumoEmojisEnabled: true, showLumoSection: false };

const openPicker = () => init({ data, ...getLumoEmojiPickerOptions(vi.fn(), composerSettings) });

const searchIds = async (query: string) => {
    const results: { id: string }[] = await SearchIndex.search(query);

    return results.map(({ id }) => id);
};

describe('getLumoEmojiPickerOptions', () => {
    it('hands the native character of a native emoji to the callback', () => {
        const onSelectText = vi.fn();

        getLumoEmojiPickerOptions(onSelectText, composerSettings).onEmojiSelect({ id: 'rocket', native: '🚀' });

        expect(onSelectText).toHaveBeenCalledWith('🚀');
    });

    it('hands the token of a Lumo emoji to the callback', () => {
        const onSelectText = vi.fn();

        getLumoEmojiPickerOptions(onSelectText, composerSettings).onEmojiSelect({ id: 'lumo-rocket' });

        expect(onSelectText).toHaveBeenCalledWith('[lumo_emoji:rocket]');
    });

    it('leaves the picker without Lumo emojis when the flag is off', () => {
        const options = getLumoEmojiPickerOptions(vi.fn(), { isLumoEmojisEnabled: false, showLumoSection: true });

        expect(Object.keys(options)).toEqual(['onEmojiSelect']);
    });

    it('registers the Lumo emojis and shows their section when the flag is on', () => {
        const { custom, categories } = getLumoEmojiPickerOptions(vi.fn(), composerSettings);

        expect(custom?.map(({ id }) => id)).toEqual(['lumo']);
        expect(categories).toContain('lumo');
    });

    it('registers the Lumo emojis but hides their section when the picker leaves it out', () => {
        const { custom, categories } = getLumoEmojiPickerOptions(vi.fn(), reactionSettings);

        expect(custom?.map(({ id }) => id)).toEqual(['lumo']);
        expect(categories).toContain('people');
        expect(categories).not.toContain('lumo');
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

describe('pickers sharing emoji-mart state', () => {
    // emoji-mart keeps its categories in module state, so each order needs a fresh copy of it.
    const openPickersInOrder = async (order: ('reaction' | 'composer')[]) => {
        vi.resetModules();

        const emojiMart = await import('emoji-mart');
        const { default: freshData } = await import('@emoji-mart/data');
        const { getLumoEmojiPickerOptions: getFreshOptions } = await import('./lumoEmojiPicker');
        const settingsByPicker = { reaction: reactionSettings, composer: composerSettings };

        const categoryIdsByPicker: Record<string, string[]> = {};

        for (const picker of [...order, ...order]) {
            await emojiMart.init({
                data: freshData,
                set: 'twitter',
                ...getFreshOptions(vi.fn(), settingsByPicker[picker]),
            });
            categoryIdsByPicker[picker] = emojiMart.Data.categories.map(({ id }: { id: string }) => id);
        }

        return categoryIdsByPicker;
    };

    it.each([
        ['reaction picker first', ['reaction', 'composer'] as const],
        ['composer first', ['composer', 'reaction'] as const],
    ])('shows the Lumo section only in the composer picker when the %s opens', async (_, order) => {
        const { reaction, composer } = await openPickersInOrder([...order]);

        expect(composer?.at(-1)).toBe('lumo');
        expect(reaction).not.toContain('lumo');
        expect(reaction).toContain('people');
    });
});

describe('Lumo section images', () => {
    const defaultMatchMedia = window.matchMedia;

    afterEach(() => {
        window.matchMedia = defaultMatchMedia;
    });

    const getRocketSkinsInFreshPicker = async () => {
        vi.resetModules();

        const { getLumoEmojiPickerOptions: getFreshLumoEmojiPickerOptions } = await import('./lumoEmojiPicker');
        const [lumoCategory] = getFreshLumoEmojiPickerOptions(vi.fn(), composerSettings).custom ?? [];

        return lumoCategory?.emojis.find(({ id }) => id === 'lumo-rocket')?.skins;
    };

    it('shows the animated image by default', async () => {
        expect(await getRocketSkinsInFreshPicker()).toEqual([
            { src: expect.stringContaining('/lumo-emojis/rocket.gif') },
        ]);
    });

    it('shows the still image when the system asks for reduced motion', async () => {
        window.matchMedia = (query) => ({
            ...defaultMatchMedia(query),
            matches: query === '(prefers-reduced-motion: reduce)',
        });

        expect(await getRocketSkinsInFreshPicker()).toEqual([
            { src: expect.stringContaining('/lumo-emojis/rocket.png') },
        ]);
    });
});
