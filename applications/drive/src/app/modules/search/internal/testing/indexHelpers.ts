import { Expression, Func, TermValue } from '@proton/proton-foundation-search';

import type { IndexReader, ReadResult } from '../worker/index/IndexReader';
import type { IndexWriter } from '../worker/index/IndexWriter';
import type { AttributeValue, IndexEntry } from '../worker/indexer/indexEntry';

export async function indexDocuments(writer: IndexWriter, entries: IndexEntry[]): Promise<void> {
    const session = writer.startWriteSession();
    for (const entry of entries) {
        session.insert(entry);
    }
    await session.commit();
}

export const makeTestIndexEntry = (id: string, attributes: Record<string, AttributeValue> = {}): IndexEntry => {
    // No trash state by default
    const defaults: Record<string, AttributeValue> = {
        trashTime: { kind: 'integer', value: 0n },
    };
    const merged = { ...defaults, ...attributes };
    return {
        documentId: id,
        attributes: [
            { name: 'test', value: { kind: 'tag', value: 'test' } },
            ...Object.entries(merged).map(([name, value]) => ({ name, value })),
        ],
    };
};

export async function findTestIndexEntries(reader: IndexReader): Promise<ReadResult[]> {
    return findDocumentsByTag(reader, 'test', 'test');
}

export async function collectResults<T>(gen: AsyncGenerator<T>): Promise<T[]> {
    const results: T[] = [];
    for await (const r of gen) {
        results.push(r);
    }
    return results;
}

export async function findDocumentsByTag(
    reader: IndexReader,
    attributeName: string,
    tagValue: string
): Promise<ReadResult[]> {
    return findDocuments(reader, { [attributeName]: tagValue });
}

type AttributeFilter = string | bigint | boolean;

/**
 * Query the index with multiple attribute filters combined with AND.
 * Supports string (tag), bigint (integer), and boolean attribute values.
 */
export async function findDocuments(
    reader: IndexReader,
    filters: Record<string, AttributeFilter>
): Promise<ReadResult[]> {
    const entries = Object.entries(filters);
    if (entries.length === 0) {
        return collectResults(reader.execute((q) => q));
    }

    const toTermValue = (value: AttributeFilter): TermValue => {
        if (typeof value === 'string') {
            return TermValue.text(value);
        }
        if (typeof value === 'bigint') {
            return TermValue.int(value);
        }
        return TermValue.bool(value);
    };

    return collectResults(
        reader.execute((q) => {
            let expr = Expression.attr(entries[0][0], Func.Equals, toTermValue(entries[0][1]));
            for (let i = 1; i < entries.length; i++) {
                expr = expr.and(Expression.attr(entries[i][0], Func.Equals, toTermValue(entries[i][1])));
            }
            return q.withStructuredExpression(expr);
        })
    );
}
