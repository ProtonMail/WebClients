import type { DecryptedKey, UserModel } from '@proton/shared/lib/interfaces';

import { getIndexKey } from './crypto/indexKey';
import { openContentSearchDB } from './db/open';
import { EncryptedSearchReader } from './import/EncryptedSearchReader';
import { initWasm } from './init';
import { IndexReader } from './search/IndexReader';

export async function lookupDoc(user: UserModel, userKeys: DecryptedKey[], docId: string): Promise<void> {
    await initWasm();
    const db = await openContentSearchDB(user.ID);
    const key = await getIndexKey(db, userKeys);
    if (!key) {
        return;
    }
    const reader = new IndexReader(db, key);
    try {
        const record = await reader.getDocumentById(docId);
        console.log('get search document by id', docId);
        console.dir(record);
        const oldStore = await EncryptedSearchReader.open(user.ID, userKeys);
        const sourceDoc = await oldStore.readMessages([docId]);
        console.log('source doc from old index');
        console.dir(sourceDoc[0]);
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
