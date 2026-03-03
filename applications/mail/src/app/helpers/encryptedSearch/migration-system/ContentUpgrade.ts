import type { IDBPDatabase } from 'idb';

import type { EncryptedSearchDB } from '@proton/encrypted-search/models';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { CONTENT_VERSION, cleanText, getContentVersion } from '../esBuild';
import { getOutdatedContentIterator, isAllContentUpToDate } from './helpers/contentVersionHelpers';
import { decryptESItem } from './helpers/decryptESItem';
import { encryptAndWriteESItem } from './helpers/encryptAndWriteESItem';
import type { EncryptedSearchData } from './interface';

type MigrateFn = (data: EncryptedSearchData) => EncryptedSearchData;

export class ContentUpgrade {
    private esDB: IDBPDatabase<EncryptedSearchDB>;
    private indexKeys: CryptoKey;

    constructor(esDB: IDBPDatabase<EncryptedSearchDB>, indexKeys: CryptoKey) {
        this.esDB = esDB;
        this.indexKeys = indexKeys;
    }

    private static readonly migrations = new Map<number, MigrateFn>([
        [
            CONTENT_VERSION.DOM_INDEXING,
            (data) => ({
                ...data,
                content: data.content
                    ? { ...data.content, decryptedBody: cleanText(data.content.decryptedBody || '', false) }
                    : undefined,
            }),
        ],
    ]);

    private defaultMigrate: MigrateFn = (data) => data;

    private async upgradeContent(version: number, data: EncryptedSearchData): Promise<void> {
        const migrate = ContentUpgrade.migrations.get(version) ?? this.defaultMigrate;
        const migratedData = migrate(data);
        const updatedData = {
            ...migratedData,
            content: migratedData.content ? { ...migratedData.content, version: getContentVersion() } : undefined,
        };

        await encryptAndWriteESItem({
            esDB: this.esDB,
            indexKey: this.indexKeys,
            item: updatedData,
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
                continue;
            }

            const version = hasVersion ? value.version : decrypted.content?.version || CONTENT_VERSION.DOM_INDEXING;
            await this.upgradeContent(version, decrypted);
        }
    }

    async isAllContentUpdated(): Promise<boolean> {
        return isAllContentUpToDate(this.esDB);
    }
}
