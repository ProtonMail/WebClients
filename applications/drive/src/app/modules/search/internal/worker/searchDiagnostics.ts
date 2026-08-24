import { Logger } from '../shared/Logger';
import type { SearchDB } from '../shared/SearchDB';
import type { SearchDiagnostics } from '../shared/searchMetrics';
import { IndexKind } from './index/IndexRegistry';

/**
 * Storage/index snapshot used as Sentry breadcrumb/extra context on search errors (indexer
 * failures and query failures alike). Never throws: a diagnostics failure must not block or mask
 * reporting of the real error.
 */
export async function gatherSearchDiagnostics(db: SearchDB): Promise<SearchDiagnostics | undefined> {
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

        return {
            blobCount,
            blobSizeMb: blobSizeBytes / 1024 / 1024,
            quarantinedNodeCount,
            storageUsageMb: (usage ?? 0) / 1024 / 1024,
            storageQuotaMb: (quota ?? 0) / 1024 / 1024,
            documentCount,
        };
    } catch (error) {
        Logger.warn(`gatherSearchDiagnostics: failed to gather search diagnostics: ${String(error)}`);
        return undefined;
    }
}
