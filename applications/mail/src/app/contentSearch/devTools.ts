import type { UserModel } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';

import { EncryptedSearchReader } from './import/EncryptedSearchReader';
import { IndexWriter } from './indexation/IndexWriter';
import { initWasm } from './init';
import { IndexReader } from './search/IndexReader';

export async function cleanupIndex(user: UserModel, keyPassword: string): Promise<void> {
    const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);
    await initWasm();
    const writer = await IndexWriter.open(user.ID, userKeys);
    await writer.cleanup();
}

export async function lookupDoc(user: UserModel, keyPassword: string, docId: string): Promise<void> {
    const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);
    await initWasm();
    const reader = await IndexReader.open(user.ID, userKeys);
    const record = await reader.getDocumentById(docId);
    console.log('get search document by id', docId);
    console.dir(record);
    const oldStore = await EncryptedSearchReader.open(user.ID, userKeys);
    const sourceDoc = await oldStore.readMessages([docId]);
    console.log('source doc from old index');
    console.dir(sourceDoc[0]);
}
