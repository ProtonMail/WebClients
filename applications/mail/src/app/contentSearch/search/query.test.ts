import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';

import { initContentSearchWasm } from '../testing/initContentSearchWasm';
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
        await initContentSearchWasm();
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
            expect(q({})).toBe('');
        });
    });

    describe('optional filters are only added when defined', () => {
        it('matches the sender against the from addresses', () => {
            expect(q({ search: { keyword: 'x', from: 'a@b.com' } })).toBe('x AND from="a@b.com"');
        });

        it('matches the recipient against the to, cc and bcc addresses', () => {
            expect(q({ search: { keyword: 'x', to: 'c@d.com' } })).toBe(
                'x AND (to="c@d.com" OR cc="c@d.com" OR bcc="c@d.com")'
            );
        });

        it('normalizes addresses like the indexed emails', () => {
            expect(q({ search: { keyword: 'x', from: ' A@B.com ' } })).toBe(
                q({ search: { keyword: 'x', from: 'a@b.com' } })
            );
        });

        it('adds no address clause for a blank address', () => {
            expect(q({ search: { keyword: 'x', from: ' ', to: '' } })).toBe('x');
        });

        it('adds an equals clause for the address id', () => {
            expect(q({ search: { keyword: 'x', address: 'addr1' } })).toBe('x AND addressId=addr1');
        });

        it('maps begin/end to time range bounds', () => {
            expect(q({ search: { keyword: 'x', begin: 100, end: 200 } })).toBe('x AND time>=100 AND time<=200');
        });
    });

    describe('label ids', () => {
        it('adds a single label without an OR group', () => {
            expect(q({ labelIDs: ['L1'], search: { keyword: 'x' } })).toBe('x AND labelId=L1');
        });

        it('folds multiple labels into an OR group', () => {
            expect(q({ labelIDs: ['L1', 'L2'], search: { keyword: 'x' } })).toBe('x AND (labelId=L1 OR labelId=L2)');
        });

        it('requires both the mailbox and the category when a category is searched', () => {
            // the engine escapes terms starting with a digit when printing them, hence the backslashes
            expect(q({ labelIDs: ['0', '24'], search: { keyword: 'x' } })).toBe('x AND labelId=\\0 AND labelId=\\24');
        });

        it('matches any of the searched categories within the mailbox', () => {
            expect(q({ labelIDs: ['0', '20', '21'], search: { keyword: 'x' } })).toBe(
                'x AND labelId=\\0 AND (labelId=\\20 OR labelId=\\21)'
            );
        });

        it('treats the legacy forum category as a category, not a mailbox', () => {
            expect(q({ labelIDs: ['0', '24', '23'], search: { keyword: 'x' } })).toBe(
                'x AND labelId=\\0 AND (labelId=\\24 OR labelId=\\23)'
            );
        });

        it('adds no label clause for an empty label list', () => {
            expect(q({ labelIDs: [], search: { keyword: 'x' } })).toBe('x');
        });
    });

    describe('attachments filter', () => {
        it('adds hasAttachments=true only when Attachments is 1', () => {
            expect(q({ filter: { Attachments: 1 }, search: { keyword: 'x' } })).toBe('x AND hasAttachments=true');
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
            'hi AND from="a@b.com" AND (to="c@d.com" OR cc="c@d.com" OR bcc="c@d.com") AND addressId=addr1 ' +
                'AND time>=100 AND time<=200 AND (labelId=L1 OR labelId=L2) AND hasAttachments=true'
        );
    });
});
