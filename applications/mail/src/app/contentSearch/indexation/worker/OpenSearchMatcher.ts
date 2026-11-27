import { Expression } from '@proton/proton-foundation-search';

import type { ESBaseMessage } from '../../../models/encryptedSearch';
import type { OpenBlobTransaction } from '../../crypto/EncryptedBlobTransaction';
import type { IndexReader } from '../../search/IndexReader';

/** A message written to the index: `Time` is its range key, in EPOCH seconds */
export type WrittenMessage = Pick<ESBaseMessage, 'ID' | 'Time'>;

/** Of the written messages, which ones a search's expression matches now, and which ones it doesn't */
export interface ExpressionMatches {
    matched: string[];
    unmatched: string[];
}

export interface ExpressionMatchListener {
    reportExpressionMatches(searchId: string, matches: ExpressionMatches): void;
}

/**
 * What a writer matches what it just committed with. It's the writer's: `startReadTxn` reads through the blob cache
 * the write warmed, at the revision it committed, which is what keeps matching fast.
 */
export interface MatchSource {
    reader: Pick<IndexReader, 'searchRange'>;
    startReadTxn(): Promise<OpenBlobTransaction>;
}

/** Written messages further apart than this in time are matched with separate searches */
export const MATCH_CLUSTER_GAP_SECONDS = 10 * 60;

/** sorted by time, split wherever two consecutive messages are more than `MATCH_CLUSTER_GAP_SECONDS` apart */
const clusterByTime = (messages: WrittenMessage[]): WrittenMessage[][] => {
    const sorted = [...messages].sort((a, b) => {
        return a.Time - b.Time;
    });
    const clusters: WrittenMessage[][] = [];
    for (const message of sorted) {
        const cluster = clusters.at(-1);
        const previous = cluster?.at(-1);
        if (cluster && previous && message.Time - previous.Time <= MATCH_CLUSTER_GAP_SECONDS) {
            cluster.push(message);
        } else {
            clusters.push([message]);
        }
    }
    return clusters;
};

/** `undefined` for an expression that doesn't parse, e.g. one posted by another app version */
const parseExpression = (expression: string): Expression | undefined => {
    try {
        return Expression.parse(expression);
    } catch {
        return undefined;
    }
};

/**
 * Tells the open searches of every tab which of the messages the index worker just wrote they match now, so they
 * can add, update or drop them without running again.
 *
 * Why the indexer does this, rather than each search watching the index: the index worker is the only place that
 * - knows exactly which messages it just wrote;
 * - already holds the database lock, as the writer. Matching here never interrupts indexing nor starves it, unlike
 *   searches re-run from the tabs would: searches take priority over indexing in `DatabaseLock`, so every tab
 *   re-running its searches on each index change would keep interrupting the indexer;
 * - has the blob cache warm from the write it just committed, which is what makes searching the index over the
 *   short time span of a batch cheap;
 * - has the bodies, so nothing large crosses worker or tab boundaries: tabs send the leader their query expressions,
 *   and only get back message IDs.
 *
 * The open searches are listed afresh on every call, from the `OpenSearchDirectory` of the leading tab: with Web
 * Locks, each search holds a lock carrying its expression, so the list follows the tabs without any bookkeeping, and
 * a new leader sees every search at once. Deleted messages don't come through here: the leading `IndexService`
 * reports the deletes of each event batch to every tab directly, as they need no index search.
 *
 * Matching searches the index over the time span of the written messages, for each open search, and only keeps the
 * written messages among the hits: the other messages in that span were matched or not already. Written messages
 * far apart in time (an event batch: new mail, and a few old messages whose labels changed) are matched in separate
 * spans, so as not to search everything in between.
 */
export class OpenSearchMatcher {
    /** written, but not matched yet: the latest write of a message wins */
    private readonly pending = new Map<string, WrittenMessage>();

    /** Whether an aborted call left messages to match: `matchWritten([])` matches them. */
    get hasPending(): boolean {
        return this.pending.size !== 0;
    }

    /** @param listOpenSearches every tab's open searches, their expression by search id */
    constructor(
        private readonly listOpenSearches: () => Promise<ReadonlyMap<string, string>>,
        private readonly listener: ExpressionMatchListener
    ) {}

    /**
     * Called by a writer once a batch is committed. Returns straight away when no search is open.
     * Otherwise sorts the written messages by time and splits them into clusters wherever two
     * consecutive times are more than `MATCH_CLUSTER_GAP_SECONDS` apart. For each cluster and each
     * open search, it searches the index over the cluster's time span, and reports which of the
     * cluster's messages match; other messages in that span are ignored.
     * If aborted (a search interrupts indexing), the messages stay pending and are matched on the
     * next call, so a committed write is never skipped. Nothing is reported then, so each search
     * gets one report per call, once every cluster was matched.
     */
    async matchWritten(messages: WrittenMessage[], source: MatchSource, signal: AbortSignal): Promise<void> {
        const expressions = await this.listOpenSearches();
        if (expressions.size === 0) {
            // a search opened later runs on the index as it is now
            this.pending.clear();
            return;
        }
        for (const { ID, Time } of messages) {
            this.pending.set(ID, { ID, Time });
        }
        if (this.pending.size === 0) {
            return;
        }
        signal.throwIfAborted();
        performance.mark('open-search-matcher-start');
        const clusters = clusterByTime([...this.pending.values()]);
        const txn = await source.startReadTxn();
        const matchesBySearch = new Map<string, ExpressionMatches>();
        for (const [searchId, expressionString] of expressions) {
            const expression = parseExpression(expressionString);
            if (!expression) {
                continue;
            }
            try {
                matchesBySearch.set(
                    searchId,
                    await this.matchClusters(expression, clusters, source.reader, txn, signal)
                );
            } finally {
                expression.free();
            }
        }
        performance.measure('open-search-matcher', {
            start: 'open-search-matcher-start',
            detail: { messages: this.pending.size, clusters: clusters.length, searches: expressions.size },
        });
        this.pending.clear();
        for (const [searchId, matches] of matchesBySearch) {
            this.listener.reportExpressionMatches(searchId, matches);
        }
    }

    private async matchClusters(
        expression: Expression,
        clusters: WrittenMessage[][],
        reader: MatchSource['reader'],
        txn: OpenBlobTransaction,
        signal: AbortSignal
    ): Promise<ExpressionMatches> {
        const matches: ExpressionMatches = { matched: [], unmatched: [] };
        for (const cluster of clusters) {
            const range = { low: BigInt(cluster[0].Time), high: BigInt(cluster[cluster.length - 1].Time) };
            const hits = new Set(await reader.searchRange(expression, range, txn, signal));
            for (const { ID } of cluster) {
                if (hits.has(ID)) {
                    matches.matched.push(ID);
                } else {
                    matches.unmatched.push(ID);
                }
            }
        }
        return matches;
    }
}
