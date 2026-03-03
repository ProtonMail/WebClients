import type { IDBPDatabase } from 'idb';

import type { EncryptedSearchDB } from '@proton/encrypted-search/models';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { CONTENT_VERSION, cleanText, getContentVersion } from '../esBuild';
import { getOutdatedContentIterator, isAllContentUpToDate } from './helpers/contentVersionHelpers';
import { decryptESItem } from './helpers/decryptESItem';
import { encryptAndWriteESItem } from './helpers/encryptAndWriteESItem';
import type { EncryptedSearchData } from './interface';

export class ContentUpgrade {
    private esDB: IDBPDatabase<EncryptedSearchDB>;
    private indexKeys: CryptoKey;

    constructor(esDB: IDBPDatabase<EncryptedSearchDB>, indexKeys: CryptoKey) {
        this.esDB = esDB;
        this.indexKeys = indexKeys;
    }

    async isAllContentUpdated(): Promise<boolean> {
        const isAllMigrated = await isAllContentUpToDate(this.esDB);
        return isAllMigrated;
    }

    private async upgradeContent(version: number, data: EncryptedSearchData): Promise<void> {
        // Content version 2 (DOM_INDEXING) can have inline HTML tags
        if (version === CONTENT_VERSION.DOM_INDEXING) {
            const newBody = cleanText(data.content?.decryptedBody || '', false);
            const updatedData = {
                ...data,
                content: { ...data.content, decryptedBody: newBody, version: getContentVersion() },
            };
            await encryptAndWriteESItem({
                esDB: this.esDB,
                indexKey: this.indexKeys,
                item: updatedData,
                version: getContentVersion(),
            });

            return;
        }

        // We don't need to change anything for content of version -1, 0, 1, or 3
        await encryptAndWriteESItem({
            esDB: this.esDB,
            indexKey: this.indexKeys,
            item: data,
            version: getContentVersion(),
        });
    }

    async migrateContent(): Promise<void> {
        const iterator = getOutdatedContentIterator(this.esDB);

        for await (const { key, value } of iterator) {
            const decrypted = await decryptESItem({ esDB: this.esDB, indexKey: this.indexKeys, itemID: key });

            const hasVersion = value.version !== -1;
            if (!decrypted) {
                traceInitiativeError(
                    SentryMailInitiatives.MIGRATION_TOOL,
                    hasVersion
                        ? new Error('Failed to decrypt content with version')
                        : new Error('Failed to decrypt content without version')
                );
                return;
            }

            const version = hasVersion ? value.version : decrypted.content?.version || CONTENT_VERSION.DOM_INDEXING;
            await this.upgradeContent(version, decrypted);
        }
    }
}
