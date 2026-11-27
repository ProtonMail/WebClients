import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import 'fake-indexeddb/auto';
import type { IDBPDatabase } from 'idb';
import type { Mock } from 'vitest';

import type { BlobCache } from '../../cache/BlobCache';
import type { OpenBlobTransaction } from '../../crypto/EncryptedBlobTransaction';
import { openContentSearchDB } from '../../db/open';
import type { Database } from '../../db/schema';
import type { IndexReader } from '../../search/IndexReader';
import type { WorkerIndexListener } from './IndexWorker';
import { IndexWrites } from './IndexWrites';
import type { MatchSource, OpenSearchMatcher } from './OpenSearchMatcher';

let userCounter = 0;

const cacheOf = (txn: OpenBlobTransaction) => {
    return (txn as unknown as { cache: BlobCache | undefined }).cache;
};

const abortError = () => {
    const error = new Error('aborted');
    error.name = 'AbortError';
    return error;
};

describe('IndexWrites', () => {
    let db: IDBPDatabase<Database>;
    let indexKey: CryptoKey;
    let matcher: { matchWritten: Mock<OpenSearchMatcher['matchWritten']>; hasPending: boolean };
    let listener: { reportDeleted: Mock<WorkerIndexListener['reportDeleted']>; log: Mock<WorkerIndexListener['log']> };
    let writes: IndexWrites;

    beforeEach(async () => {
        db = await openContentSearchDB(`index-writes-${userCounter++}`);
        indexKey = await generateAndImportKey();
        matcher = { matchWritten: vi.fn(async () => {}), hasPending: false };
        listener = { reportDeleted: vi.fn(), log: vi.fn() };
        writes = new IndexWrites(
            db,
            {} as IndexReader,
            indexKey,
            { shortLivedCache: true },
            matcher as unknown as OpenSearchMatcher,
            listener
        );
    });

    afterEach(() => {
        writes.dispose();
        db.close();
    });

    it('matches through a read transaction on the blob cache the last write transaction warmed', async () => {
        const writeTxn = await writes.startBlobTxn();
        let readTxn: OpenBlobTransaction | undefined;
        matcher.matchWritten.mockImplementation(async (_messages, source: MatchSource) => {
            readTxn = await source.startReadTxn();
        });

        await writes.matchWritten([{ ID: 'a', Time: 100 }], new AbortController().signal);

        expect(cacheOf(readTxn!)).toBeDefined();
        expect(cacheOf(readTxn!)).toBe(cacheOf(writeTxn));
    });

    it('never fails the write it matches: an abort is left to the task, an error is logged', async () => {
        const controller = new AbortController();
        controller.abort(abortError());
        matcher.matchWritten.mockRejectedValueOnce(controller.signal.reason);
        await expect(writes.matchWritten([], controller.signal)).resolves.toBeUndefined();
        expect(listener.log).not.toHaveBeenCalled();

        matcher.matchWritten.mockRejectedValueOnce(new Error('broken'));
        await expect(writes.matchWritten([], new AbortController().signal)).resolves.toBeUndefined();
        expect(listener.log).toHaveBeenCalledWith('error', expect.stringContaining('broken'));
    });

    it('matches what is pending only when an interrupted matching left something', async () => {
        await writes.matchPending(new AbortController().signal);
        expect(matcher.matchWritten).not.toHaveBeenCalled();

        matcher.hasPending = true;
        await writes.matchPending(new AbortController().signal);
        expect(matcher.matchWritten).toHaveBeenCalledWith([], expect.anything(), expect.anything());
    });

    it('reports deleted messages, and nothing for a write without deletes', () => {
        writes.reportDeleted([]);
        writes.reportDeleted(['a', 'b']);

        expect(listener.reportDeleted.mock.calls).toEqual([[['a', 'b']]]);
    });
});
