import { Logger } from '../shared/Logger';
import type { SearchDB } from '../shared/SearchDB';
import type { SearchDiagnostics } from '../shared/searchMetrics';
import { IndexKind, getWasmMemoryBytes } from './index/IndexRegistry';
import type { IndexRegistry } from './index/IndexRegistry';

const roundMb = (mb: number): number => Math.round(mb * 1000) / 1000;

/**
 * Storage/index snapshot used as Sentry breadcrumb/extra context on search errors (indexer
 * failures and query failures alike). Never throws: a diagnostics failure must not block or mask
 * reporting of the real error.
 */
export async function gatherSearchDiagnostics(
    db: SearchDB,
    indexRegistry: IndexRegistry | null
): Promise<SearchDiagnostics | undefined> {
    try {
        // We have only one index for now (IndexKind.MAIN) and will most likely never add another
        // one for this implementation.
        const [blobCount, blobSizeBytes, documentCount, quarantinedNodeCount, { usage, quota }] = await Promise.all([
            db.countIndexBlobs(IndexKind.MAIN),
            db.getIndexBlobsByteSize(IndexKind.MAIN),
            db.getDocumentCount(IndexKind.MAIN),
            db.countRepairEntries(),
            navigator.storage.estimate(),
        ]);

        // peek(), not get(): a diagnostics read must never build an engine that doesn't exist yet.
        // Undefined here just means no in-memory cache state to report, e.g. when the failure
        // happened before an engine was ever built.
        const indexInstance = indexRegistry?.peek(IndexKind.MAIN);
        const cacheStats = indexInstance?.blobStore.getCacheStats();
        const wasmMemoryBytes = getWasmMemoryBytes();

        return {
            blobCount,
            blobsTotalSizeMb: roundMb(blobSizeBytes / 1024 / 1024),
            quarantinedNodeCount,
            storageUsageMb: roundMb((usage ?? 0) / 1024 / 1024),
            storageQuotaMb: roundMb((quota ?? 0) / 1024 / 1024),
            documentCount,
            blobCacheEntryCount: cacheStats?.blobsCount,
            blobCachePendingFreeCount: cacheStats?.pendingFreeBlobsCount,
            blobCacheSizesMb: cacheStats?.blobSizesInMb.map((mb) => mb.toFixed(3)).join('/'),
            wasmMemoryMb: wasmMemoryBytes !== undefined ? roundMb(wasmMemoryBytes / 1024 / 1024) : undefined,
            lastCommitDurationMs: indexInstance?.indexWriter.getLastCommitDurationMs(),
        };
    } catch (error) {
        Logger.warn(`gatherSearchDiagnostics: failed to gather search diagnostics: ${String(error)}`);
        return undefined;
    }
}
