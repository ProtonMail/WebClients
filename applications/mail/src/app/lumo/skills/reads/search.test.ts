import { getUnixTime } from 'date-fns';

import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';

import { BULK_ACTION_NOTE } from './rows';
import type { SearchParams, SearchResult } from './search';
import {
    describeSearch,
    describeSearchScope,
    searchChipLabel,
    searchDefinition,
    searchModule,
    toSearchBound,
} from './search';

const anyReferences = {} as any;

const params = (overrides: Partial<SearchParams> = {}): SearchParams => ({
    keyword: null,
    from: null,
    to: null,
    target: null,
    begin: null,
    end: null,
    filter: null,
    ...overrides,
});

const result = (overrides: Partial<SearchResult> = {}): SearchResult => ({
    query: 'all mail',
    coverage: 'full',
    scope: 'Axes not used in this search: keyword, from, to, date range, folder or label.',
    rows: [],
    total: 0,
    bulkActionRunning: false,
    ...overrides,
});

describe('toSearchBound', () => {
    it('bounds the LOCAL calendar day, as the mailbox date pickers do', () => {
        expect(toSearchBound('2026-07-29')).toBe(String(getUnixTime(new Date(2026, 6, 29))));
    });

    it('extends an upper bound to cover the whole day', () => {
        expect(Number(toSearchBound('2026-07-29', true)) - Number(toSearchBound('2026-07-29'))).toBe(86_400);
    });

    // A plain Error reaches the model as "the search tool failed", which it cannot act on; only a
    // ToolInputError carries the correction through.
    it('throws a self-correcting error on an unreadable date', () => {
        expect(() => toSearchBound('last Tuesday')).toThrow(ToolInputError);
        expect(() => toSearchBound('last Tuesday')).toThrow(/ISO date/);
    });
});

describe('describeSearch', () => {
    it('describes an unfiltered search as all mail', () => {
        expect(describeSearch(params(), {})).toBe('all mail');
    });

    it('describes the query the way it was asked', () => {
        const described = describeSearch(
            params({ keyword: 'hotel', from: 'alice@example.com', begin: '2026-07-01' }),
            {}
        );
        expect(described).toBe('"hotel", from:alice@example.com, from 2026-07-01');
    });

    // Both bounds are inclusive, so "after"/"before" would tell the model — and through it the user —
    // that the two edge days were excluded when they were in fact searched.
    it('describes a date range as inclusive on both ends', () => {
        const described = describeSearch(params({ begin: '2026-07-01', end: '2026-07-29' }), {});

        expect(described).toBe('from 2026-07-01, to 2026-07-29');
        expect(described).not.toMatch(/after|before/);
    });

    it('names the searched folder or label, never its reference', () => {
        const described = describeSearch(params({ keyword: 'hotel', target: 'label-a1b2c3' }), {}, 'Travel');

        expect(described).toBe('"hotel", in Travel');
        expect(described).not.toContain('label-a1b2c3');
    });

    it('describes the validated filter, so the payload matches what is on screen', () => {
        expect(describeSearch(params({ filter: 'unread' }), { filter: 'unread' })).toContain('unread');
        expect(describeSearch(params({ filter: 'has_attachment' }), { filter: 'has_attachment' })).toContain(
            'has attachment'
        );
    });
});

describe('searchChipLabel', () => {
    it('leads on the keyword the user gave', () => {
        expect(searchChipLabel(params({ keyword: 'hotel', from: 'alice@example.com' }))).toBe('Searched for “hotel”');
    });

    it('falls back to the sender, then the recipient', () => {
        expect(searchChipLabel(params({ from: 'alice@example.com' }))).toBe('Searched for mail from alice@example.com');
        expect(searchChipLabel(params({ to: 'bob@example.com' }))).toBe('Searched for mail to bob@example.com');
    });

    it('names the folder or label rather than leaking its reference', () => {
        const label = searchChipLabel(params({ target: 'folder-a1b2c3' }), 'Travel');

        expect(label).toBe('Searched Travel');
        expect(label).not.toContain('folder-a1b2c3');
    });

    it('describes a whole-mailbox search without exposing the query internals', () => {
        expect(searchChipLabel(params({ filter: 'unread' }))).toBe('Searched your mail');
    });
});

describe('searchDefinition', () => {
    // The body is engine-dependent, so the registry builds it from `createGuide`; a static one here would
    // freeze whichever engine was active at provider mount.
    it('is a guided read whose body comes from deps, not the definition', () => {
        expect(searchDefinition.kind).toBe('read');
        expect(searchDefinition.needsGuide).toBe(true);
        expect(searchDefinition.guide).toBeUndefined();
        expect(searchModule.createGuide).toBeDefined();
    });

    it('requires every param, so the model must pass null rather than omit', () => {
        expect(searchDefinition.paramsSchema.additionalProperties).toBe(false);
        expect(searchDefinition.paramsSchema.required).toEqual(Object.keys(searchDefinition.paramsSchema.properties));
    });

    // Every param but `target` is free text, and the engine's hallucination guard rejects any value shaped
    // like a reference — so an ordinary keyword ("e-ticket") would never reach the handler.
    it('exempts its free-text params from the reference guard, leaving only the target guarded', () => {
        const guarded = Object.keys(searchDefinition.paramsSchema.properties).filter(
            (param) => !searchDefinition.freeTextParams?.includes(param)
        );

        expect(guarded).toEqual(['target']);
    });

    it.each([
        ['partial', 'capped index'],
        ['metadata_only', 'were NOT searched'],
        ['unfinished', 'had NOT finished'],
    ] as const)('reports what %s coverage left unsearched, without directing the next step', (coverage, fact) => {
        const serialized = searchDefinition.serializeForLumo(result({ coverage }), anyReferences);

        expect(serialized).toContain(fact);
        expect(serialized).not.toContain('Do NOT');
        expect(serialized).not.toContain('offer to');
    });

    it('names the axes the search left unused, and the Spam/Trash blind spot', () => {
        const scope = describeSearchScope(params({ keyword: 'ticket*' }), true);

        expect(scope).toBe(
            'Axes not used in this search: from, to, date range, folder or label. Spam and Trash were outside its scope.'
        );
        expect(searchDefinition.serializeForLumo(result({ scope }), anyReferences)).toContain(scope);
    });

    it('keeps quiet about Spam and Trash when the search actually covered them', () => {
        expect(describeSearchScope(params({ target: 'folder-x7b2q1' }), false)).toBe(
            'Axes not used in this search: keyword, from, to, date range.'
        );
    });

    it('vouches for an empty result only when the whole mailbox was body-searched', () => {
        const serialized = searchDefinition.serializeForLumo(result({ coverage: 'full' }), anyReferences);

        expect(serialized).toContain('across the whole mailbox');
        expect(serialized).not.toContain('Do NOT tell the user');
    });

    it('serializes an empty result as no matches rather than an empty table', () => {
        expect(searchDefinition.serializeForLumo(result(), anyReferences)).toContain('No emails matched this search.');
    });

    // Otherwise a blocked location reads as an authoritative "nothing matches", which is the false
    // negative the bulk-action note exists to prevent.
    it('blames a running bulk action for an empty result rather than the search', () => {
        const serialized = searchDefinition.serializeForLumo(result({ bulkActionRunning: true }), anyReferences);

        expect(serialized).toContain(BULK_ACTION_NOTE);
        expect(serialized).not.toContain('No emails matched this search.');
    });

    it('summarizes the chip from what the user asked for, not the model-facing query', () => {
        expect(searchDefinition.summarizeChip(params({ keyword: 'hotel' }), result()).label).toBe(
            'Searched for “hotel”'
        );
    });

    it('keeps its examples free of operators, which only one engine parses', () => {
        searchDefinition.examples?.forEach(({ call }) => {
            expect(call.keyword ?? '').not.toMatch(/[|!*?^$()]/);
        });
    });

    it('shows the metadata axis as well as the keyword one', () => {
        expect(searchDefinition.examples).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    call: expect.objectContaining({ keyword: null, from: 'Sam', begin: '2026-07-01' }),
                }),
            ])
        );
    });

    it('leaves the parameters to the guide, so its description stays short', () => {
        expect(searchDefinition.toolDescription).toContain('load_guide');
        expect(searchDefinition.toolDescription.length).toBeLessThan(500);
    });
});
