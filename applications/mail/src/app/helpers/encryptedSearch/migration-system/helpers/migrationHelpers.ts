import type { IDBPDatabase } from 'idb';

import type { EncryptedSearchDB } from '@proton/encrypted-search/models';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { CONTENT_VERSION, getContentVersion } from '../../esBuild';
import type { CleanTextFn, EncryptedSearchData, MigrateFn } from '../interface';
import { createMigrations } from './contentMigrations';
import { getOutdatedContentIterator } from './contentVersionHelpers';
import { decryptESItem } from './decryptESItem';
import { encryptAndWriteESItem } from './encryptAndWriteESItem';

const defaultMigrate: MigrateFn = (data) => data;

interface UpgradeContentProps {
    version: number;
    data: EncryptedSearchData;
    esDB: IDBPDatabase<EncryptedSearchDB>;
    indexKey: CryptoKey;
    migrations: Map<number, MigrateFn>;
}

const upgradeContent = async ({ version, data, esDB, indexKey, migrations }: UpgradeContentProps): Promise<void> => {
    const migrate = migrations.get(version) ?? defaultMigrate;
    const migratedData = migrate(data);
    const updatedData = {
        ...migratedData,
        content: migratedData.content ? { ...migratedData.content, version: getContentVersion() } : undefined,
    };

    await encryptAndWriteESItem({
        esDB,
        indexKey,
        item: updatedData,
        version: getContentVersion(),
    });
};

interface MigrateContentProps {
    esDB: IDBPDatabase<EncryptedSearchDB>;
    indexKey: CryptoKey;
    cleanText: CleanTextFn;
}

export const migrateContent = async ({ esDB, indexKey, cleanText }: MigrateContentProps) => {
    const migrations = createMigrations(cleanText);
    const iterator = getOutdatedContentIterator(esDB);

    for await (const { key, value } of iterator) {
        try {
            const decrypted = await decryptESItem({ esDB, indexKey, itemID: key });
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
            await upgradeContent({ version, data: decrypted, esDB, indexKey, migrations });
        } catch (error) {
            traceInitiativeError(SentryMailInitiatives.MIGRATION_TOOL, error);
        }
    }
};
