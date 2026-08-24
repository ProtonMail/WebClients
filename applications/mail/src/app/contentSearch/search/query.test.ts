import type { NormalizedSearchParams } from '@proton/encrypted-search/models';

import { initFoundationWasm } from '../testing/initFoundationWasm';
import { buildQuery } from './query';

// buildQuery produces a wasm `Expression`; asserting on its `toString()` keeps the tests readable
// and pins the exact clause/operator/quoting the search engine will run.
const q = (over: Partial<NormalizedSearchParams> & { search?: NormalizedSearchParams['search'] }): string =>
    buildQuery({
        labelIDs: [],
        sort: { sort: 'Time', desc: true },
        filter: {},
        search: {},
        normalizedKeywords: undefined,
        ...over,
    } as NormalizedSearchParams).toString();

describe('buildQuery', () => {
    beforeAll(async () => {
        await initFoundationWasm();
    });

    describe('keywords', () => {
        it('matches the keyword against body and subject', () => {
            expect(q({ search: { keyword: 'hello' } })).toBe('hello');
        });

        // the query is parsed as typed, so the normalized (lowercased, tokenized) keywords are never used
        it('ignores normalizedKeywords and only uses the keyword as typed', () => {
            expect(q({ search: { keyword: 'Hello' }, normalizedKeywords: ['ignored'] })).toBe('Hello');
        });

        it('produces an empty match when there is no keyword', () => {
            expect(q({})).toBe('()');
        });
    });

    describe('optional filters are only added when defined', () => {
        it('adds an equals clause for the sender', () => {
            expect(q({ search: { keyword: 'x', from: 'a@b.com' } })).toBe('(x AND sender="a@b.com")');
        });

        it('adds an equals clause for the recipient', () => {
            expect(q({ search: { keyword: 'x', to: 'c@d.com' } })).toBe('(x AND recipient="c@d.com")');
        });

        it('adds an equals clause for the address id', () => {
            expect(q({ search: { keyword: 'x', address: 'addr1' } })).toBe('(x AND addressId=addr1)');
        });

        it('maps begin/end to time range bounds', () => {
            expect(q({ search: { keyword: 'x', begin: 100, end: 200 } })).toBe('(x AND time>=100 AND time<=200)');
        });
    });

    describe('label ids', () => {
        it('adds a single label without an OR group', () => {
            expect(q({ labelIDs: ['L1'], search: { keyword: 'x' } })).toBe('(x AND labelId=L1)');
        });

        it('folds multiple labels into an OR group', () => {
            expect(q({ labelIDs: ['L1', 'L2'], search: { keyword: 'x' } })).toBe('(x AND (labelId=L1 OR labelId=L2))');
        });

        it('adds no label clause for an empty label list', () => {
            expect(q({ labelIDs: [], search: { keyword: 'x' } })).toBe('x');
        });
    });

    describe('attachments filter', () => {
        it('adds hasAttachments=true only when Attachments is 1', () => {
            expect(q({ filter: { Attachments: 1 }, search: { keyword: 'x' } })).toBe('(x AND hasAttachments=true)');
        });

        it('omits the clause when Attachments is 0', () => {
            expect(q({ filter: { Attachments: 0 }, search: { keyword: 'x' } })).toBe('x');
        });
    });

    it('ignores the Unread filter (it is not indexed)', () => {
        expect(q({ filter: { Unread: 1 }, search: { keyword: 'x' } })).toBe('x');
    });

    it('combines every clause with AND', () => {
        expect(
            q({
                labelIDs: ['L1', 'L2'],
                filter: { Attachments: 1, Unread: 1 },
                search: { keyword: 'hi', from: 'a@b.com', to: 'c@d.com', address: 'addr1', begin: 100, end: 200 },
            })
        ).toBe(
            '(hi AND sender="a@b.com" AND recipient="c@d.com" AND addressId=addr1 ' +
                'AND time>=100 AND time<=200 AND (labelId=L1 OR labelId=L2) AND hasAttachments=true)'
        );
    });
});
