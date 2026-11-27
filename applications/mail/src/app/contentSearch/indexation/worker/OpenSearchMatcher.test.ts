import type { Mock } from 'vitest';

import type { Expression } from '@proton/proton-foundation-search';

import type { OpenBlobTransaction } from '../../crypto/EncryptedBlobTransaction';
import { initContentSearchWasm } from '../../testing/initContentSearchWasm';
import {
    type ExpressionMatchListener,
    MATCH_CLUSTER_GAP_SECONDS,
    type MatchSource,
    OpenSearchMatcher,
    type WrittenMessage,
} from './OpenSearchMatcher';

const message = (ID: string, Time: number): WrittenMessage => {
    return { ID, Time };
};

const signal = () => {
    return new AbortController().signal;
};

/** a reader whose hits are given per expression, over the whole time range */
const fakeSource = (hitsByExpression: Record<string, string[]>) => {
    const txn = {} as OpenBlobTransaction;
    /** the expression, as a string as it's freed after the call, and the range of each search */
    const searched: [string, number, number][] = [];
    const searchRange = vi.fn(
        async (
            exp: Expression,
            range: { low: bigint; high: bigint },
            _txn: OpenBlobTransaction,
            abort: AbortSignal
        ) => {
            abort.throwIfAborted();
            searched.push([exp.toString(), Number(range.low), Number(range.high)]);
            return hitsByExpression[exp.toString()] ?? [];
        }
    );
    const source = {
        reader: { searchRange },
        startReadTxn: vi.fn(async () => {
            return txn;
        }),
    } satisfies MatchSource;
    const ranges = () => {
        return searched;
    };
    return { source, searchRange, txn, ranges };
};

describe('OpenSearchMatcher', () => {
    let listener: { reportExpressionMatches: Mock<ExpressionMatchListener['reportExpressionMatches']> };
    let matcher: OpenSearchMatcher;
    /** the searches open in the tabs, as listed at each call */
    let openSearches: Map<string, string>;

    beforeAll(async () => {
        await initContentSearchWasm();
    });

    beforeEach(() => {
        listener = { reportExpressionMatches: vi.fn() };
        openSearches = new Map();
        matcher = new OpenSearchMatcher(async () => {
            return new Map(openSearches);
        }, listener);
    });

    it('does not read the index when no search is open', async () => {
        const { source, searchRange } = fakeSource({});

        await matcher.matchWritten([message('a', 100)], source, signal());

        expect(source.startReadTxn).not.toHaveBeenCalled();
        expect(searchRange).not.toHaveBeenCalled();
        expect(listener.reportExpressionMatches).not.toHaveBeenCalled();
    });

    it('drops what an aborted call left pending once no search is open', async () => {
        const { source, ranges } = fakeSource({});
        openSearches.set('search-1', 'hello');
        const aborted = new AbortController();
        aborted.abort();
        await expect(matcher.matchWritten([message('a', 100)], source, aborted.signal)).rejects.toThrow();
        openSearches.delete('search-1');
        await matcher.matchWritten([message('b', 200)], source, signal());

        openSearches.set('search-2', 'world');
        await matcher.matchWritten([message('c', 300)], source, signal());

        expect(ranges()).toEqual([['world', 300, 300]]);
    });

    it('does not match what was written before a search opened', async () => {
        const { source, ranges } = fakeSource({});
        await matcher.matchWritten([message('a', 100)], source, signal());

        openSearches.set('search-1', 'hello');
        await matcher.matchWritten([message('b', 200)], source, signal());

        expect(ranges()).toEqual([['hello', 200, 200]]);
    });

    it('splits the written messages into clusters further apart than the gap', async () => {
        const { source, ranges } = fakeSource({});
        openSearches.set('search-1', 'hello');

        await matcher.matchWritten(
            [
                message('d', 5_000),
                message('a', 0),
                message('b', MATCH_CLUSTER_GAP_SECONDS),
                message('c', 2 * MATCH_CLUSTER_GAP_SECONDS + 1),
            ],
            source,
            signal()
        );

        expect(ranges()).toEqual([
            ['hello', 0, MATCH_CLUSTER_GAP_SECONDS],
            ['hello', 2 * MATCH_CLUSTER_GAP_SECONDS + 1, 2 * MATCH_CLUSTER_GAP_SECONDS + 1],
            ['hello', 5_000, 5_000],
        ]);
    });

    it('reports which written messages each search matches, ignoring the other hits in their span', async () => {
        const { source } = fakeSource({ hello: ['a', 'not-written'], world: ['b'] });
        openSearches.set('search-1', 'hello');
        openSearches.set('search-2', 'world');

        await matcher.matchWritten([message('a', 100), message('b', 110)], source, signal());

        expect(listener.reportExpressionMatches.mock.calls).toEqual([
            ['search-1', { matched: ['a'], unmatched: ['b'] }],
            ['search-2', { matched: ['b'], unmatched: ['a'] }],
        ]);
    });

    it('matches through the read transaction of the writer, started once per call', async () => {
        const { source, searchRange, txn } = fakeSource({});
        openSearches.set('search-1', 'hello');
        openSearches.set('search-2', 'world');

        await matcher.matchWritten([message('a', 100), message('b', 100_000)], source, signal());

        expect(source.startReadTxn).toHaveBeenCalledTimes(1);
        expect(searchRange).toHaveBeenCalledTimes(4);
        for (const call of searchRange.mock.calls) {
            expect(call[2]).toBe(txn);
        }
    });

    it('keeps the messages of an aborted call pending, and matches them on the next one', async () => {
        const { source, ranges } = fakeSource({ hello: ['a', 'b'] });
        openSearches.set('search-1', 'hello');
        const aborted = new AbortController();
        aborted.abort();

        await expect(matcher.matchWritten([message('a', 100)], source, aborted.signal)).rejects.toThrow();
        expect(listener.reportExpressionMatches).not.toHaveBeenCalled();

        await matcher.matchWritten([message('b', 200)], source, signal());

        expect(listener.reportExpressionMatches.mock.calls).toEqual([
            ['search-1', { matched: ['a', 'b'], unmatched: [] }],
        ]);
        await matcher.matchWritten([], source, signal());
        expect(ranges()).toEqual([['hello', 100, 200]]);
    });

    it('tells whether an aborted call left messages to match', async () => {
        const { source } = fakeSource({});
        openSearches.set('search-1', 'hello');
        const aborted = new AbortController();
        aborted.abort();
        expect(matcher.hasPending).toBe(false);

        await expect(matcher.matchWritten([message('a', 100)], source, aborted.signal)).rejects.toThrow();
        expect(matcher.hasPending).toBe(true);

        await matcher.matchWritten([], source, signal());
        expect(matcher.hasPending).toBe(false);
        expect(listener.reportExpressionMatches.mock.calls).toEqual([['search-1', { matched: [], unmatched: ['a'] }]]);
    });

    it('matches the latest write of a message written twice once', async () => {
        const { source, ranges } = fakeSource({ hello: ['a'] });
        openSearches.set('search-1', 'hello');
        const aborted = new AbortController();
        aborted.abort();
        await expect(matcher.matchWritten([message('a', 100)], source, aborted.signal)).rejects.toThrow();

        await matcher.matchWritten([message('a', 100)], source, signal());

        expect(ranges()).toEqual([['hello', 100, 100]]);
        expect(listener.reportExpressionMatches.mock.calls).toEqual([['search-1', { matched: ['a'], unmatched: [] }]]);
    });

    it('stops matching a search once closed, and skips an expression it cannot parse', async () => {
        const { source, ranges } = fakeSource({});
        openSearches.set('search-1', 'hello');
        openSearches.set('search-2', '"unbalanced');
        openSearches.set('search-3', 'world');
        openSearches.delete('search-3');

        await matcher.matchWritten([message('a', 100)], source, signal());

        expect(ranges()).toEqual([['hello', 100, 100]]);
        expect(listener.reportExpressionMatches.mock.calls).toEqual([['search-1', { matched: [], unmatched: ['a'] }]]);
    });
});
