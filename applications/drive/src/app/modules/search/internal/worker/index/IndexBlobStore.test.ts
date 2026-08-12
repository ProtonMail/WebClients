import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { Engine } from '@proton/proton-foundation-search';

import { SearchDB } from '../../shared/SearchDB';
import { SearchBlobCryptoError, SearchLibraryError, classifyError, isRepairableError } from '../../shared/errors';
import { findTestIndexEntries, indexDocuments, makeTestIndexEntry } from '../../testing/indexHelpers';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { IndexBlobStore } from './IndexBlobStore';
import { IndexReader } from './IndexReader';
import { IndexKind } from './IndexRegistry';
import { IndexWriter } from './IndexWriter';

setupRealSearchLibraryWasm();

describe('IndexBlobStore crypto failures', () => {
    let db: SearchDB;
    let engine: ReturnType<typeof Engine.builder.prototype.build>;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        engine = Engine.builder().build();
    });

    afterEach(() => {
        engine.free();
    });

    const expectBlobCryptoError = (error: unknown) => {
        expect(error).toBeInstanceOf(SearchBlobCryptoError);
        // Deliberately NOT search_library_error: the engine is fine, the local data is not, and
        // that bucket is our signal for real WASM faults.
        expect(error).not.toBeInstanceOf(SearchLibraryError);
        expect(classifyError(error)).toEqual({ kind: 'permanent', reason: 'search_crypto_error' });
        expect(isRepairableError(error)).toBe(false);
    };

    it('a blob that will not decrypt surfaces as a permanent search_crypto_error', async () => {
        // Write blobs under one key, then read them back under another. Real AES-GCM, so this is a
        // genuine auth-tag mismatch rather than a stubbed rejection.
        const writeKey = await generateAndImportKey();
        const writer = new IndexWriter(engine, new IndexBlobStore(IndexKind.MAIN, db, writeKey));
        await indexDocuments(writer, [makeTestIndexEntry('doc-1')]);

        const readKey = await generateAndImportKey();
        const freshEngine = Engine.builder().build();
        try {
            const reader = new IndexReader(freshEngine, new IndexBlobStore(IndexKind.MAIN, db, readKey));
            const error = await findTestIndexEntries(reader).catch((e: unknown) => e);

            expectBlobCryptoError(error);
        } finally {
            freshEngine.free();
        }
    });

    it('a blob that will not encrypt surfaces as a permanent search_crypto_error', async () => {
        // A decrypt-only key makes WebCrypto reject on encrypt. This also guards the async/await
        // inside putEncryptedIndexBlob's callback: with a bare `return`, the rejection would skip
        // the SearchBlobCryptoError wrap and land as a generic SearchLibraryError instead.
        const decryptOnlyKey = await generateAndImportKey(['decrypt']);
        const writer = new IndexWriter(engine, new IndexBlobStore(IndexKind.MAIN, db, decryptOnlyKey));

        const error = await indexDocuments(writer, [makeTestIndexEntry('doc-1')]).catch((e: unknown) => e);

        expectBlobCryptoError(error);
    });

    it('round-trips normally when the same key is used', async () => {
        const cryptoKey = await generateAndImportKey();
        const blobStore = new IndexBlobStore(IndexKind.MAIN, db, cryptoKey);
        const writer = new IndexWriter(engine, blobStore);
        await indexDocuments(writer, [makeTestIndexEntry('doc-1')]);

        const reader = new IndexReader(engine, blobStore);
        expect((await findTestIndexEntries(reader)).map((r) => r.identifier)).toContain('doc-1');
    });
});
