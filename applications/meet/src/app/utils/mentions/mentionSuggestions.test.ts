import { describe, expect, it } from 'vitest';

import { filterMentionSuggestions, getMentionSuggestions } from './mentionSuggestions';

const LOCAL = 'local-uuid';
const ALICE = 'alice-uuid';
const ROBERT = 'robert-uuid';

const build = (overrides: Partial<Parameters<typeof getMentionSuggestions>[0]> = {}) =>
    getMentionSuggestions({
        sortedIdentities: [LOCAL, ALICE, ROBERT],
        participantNameMap: {
            [LOCAL]: 'Marina Norbert',
            [ALICE]: 'Alice Nguyen',
            [ROBERT]: 'Robert Fox',
        },
        localIdentity: LOCAL,
        everyoneName: 'everyone',
        ...overrides,
    });

describe('getMentionSuggestions', () => {
    it('lists everyone first and leaves out the local participant', () => {
        expect(build().map(({ id }) => id)).toEqual(['everyone', ALICE, ROBERT]);
    });

    it('marks the room-wide entry', () => {
        expect(build()[0]).toMatchObject({ id: 'everyone', name: 'everyone', isEveryone: true });
    });

    it('leaves out participants whose name is not available yet', () => {
        const suggestions = build({
            participantNameMap: { [ALICE]: 'Alice Nguyen' },
        });

        expect(suggestions.map(({ id }) => id)).toEqual(['everyone', ALICE]);
    });

    it('suggests nothing when the local participant is alone', () => {
        expect(
            build({
                sortedIdentities: [LOCAL],
                participantNameMap: { [LOCAL]: 'Marina Norbert' },
            })
        ).toEqual([]);
    });
});

describe('filterMentionSuggestions', () => {
    it('returns everything for an empty query', () => {
        expect(filterMentionSuggestions(build(), '')).toHaveLength(3);
    });

    it('keeps only matching names', () => {
        expect(filterMentionSuggestions(build(), 'ali').map(({ id }) => id)).toEqual([ALICE]);
    });

    it('ignores case', () => {
        expect(filterMentionSuggestions(build(), 'ROBERT').map(({ id }) => id)).toEqual([ROBERT]);
    });

    it('matches on a later part of the name', () => {
        expect(filterMentionSuggestions(build(), 'fox').map(({ id }) => id)).toEqual([ROBERT]);
    });

    it('matches across the space in a full name', () => {
        expect(filterMentionSuggestions(build(), 'alice ng').map(({ id }) => id)).toEqual([ALICE]);
    });

    it('matches an accented name from an unaccented query', () => {
        const suggestions = build({
            participantNameMap: { [ALICE]: 'Renée Fabre' },
        });

        expect(filterMentionSuggestions(suggestions, 'renee').map(({ id }) => id)).toEqual([ALICE]);
    });

    it('matches an unaccented name from an accented query', () => {
        expect(filterMentionSuggestions(build(), 'róbert').map(({ id }) => id)).toEqual([ROBERT]);
    });

    it('matches names using decomposed combining marks', () => {
        const suggestions = build({
            participantNameMap: { [ALICE]: 'Rene\u0301e Fabre' },
        });

        expect(filterMentionSuggestions(suggestions, 'renee').map(({ id }) => id)).toEqual([ALICE]);
    });

    it('returns nothing when no name matches', () => {
        expect(filterMentionSuggestions(build(), 'zzz')).toEqual([]);
    });
});
