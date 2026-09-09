import type { DecryptedKey, UserModel } from '@proton/shared/lib/interfaces';

import type { ESMessage } from '../models/encryptedSearch';
import { getIndexKey } from './crypto/indexKey';
import { openContentSearchDB } from './db/open';
import { EncryptedSearchReader } from './import/EncryptedSearchReader';
import { initWasm } from './init';
import { IndexReader } from './search/IndexReader';

export interface DocLookupResult {
    docId: string;
    /** The document as stored in the foundation-search index, if it's indexed. */
    indexDoc: Record<string, any[]> | undefined;
    /** The same document as stored in the old encrypted search index, if that index is still around. */
    sourceDoc: ESMessage | undefined;
}

export async function lookupDoc(user: UserModel, userKeys: DecryptedKey[], docId: string): Promise<DocLookupResult> {
    await initWasm();
    const db = await openContentSearchDB(user.ID);
    const key = await getIndexKey(db, userKeys);
    if (!key) {
        db.close();
        throw new Error('No index key found, is the index created?');
    }
    const reader = new IndexReader(db, key);
    try {
        const indexDoc = await reader.getDocumentById(docId);
        const oldStore = await EncryptedSearchReader.open(user.ID, userKeys);
        const sourceDoc = oldStore ? (await oldStore.readMessages([docId]))[0] : undefined;
        return { docId, indexDoc, sourceDoc };
    } finally {
        db.close();
    }
}

export async function getIndexByteSize(userId: string): Promise<number> {
    const db = await openContentSearchDB(userId);
    try {
        const store = db.transaction('index_blobs').store;
        let byteSize = 0;
        for await (const cursor of store.iterate()) {
            byteSize += cursor.value.byteLength;
        }
        return byteSize;
    } finally {
        db.close();
    }
}
