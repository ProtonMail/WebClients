import { openContentSearchDB } from '../db/open';
import { initWasm } from '../init';
import { EncryptedSearchReader } from './EncryptedSearchReader';
import { BATCH_SIZE, Import, type ImportNotifications } from './Import';

export default class ImportWorker {
    private running = false;

    async import(
        userId: string,
        keys: {
            indexV1Key: CryptoKey;
            indexV2Key: CryptoKey;
        },
        notifications: ImportNotifications
    ): Promise<void> {
        if (this.running) {
            return;
        }
        this.running = true;
        try {
            await initWasm();
            const esReader = await EncryptedSearchReader.openWithIndexKey(userId, keys.indexV1Key);
            // No v1 index to import from. `IndexService.importFromEncryptedSearch` already checks this
            // before spawning the worker, but guard here too so we never proceed without a source.
            if (!esReader) {
                return;
            }
            const db = await openContentSearchDB(userId);
            const importer = new Import(db, keys.indexV2Key, esReader, notifications, BATCH_SIZE);
            await importer.run();
        } finally {
            this.running = false;
        }
    }
}
