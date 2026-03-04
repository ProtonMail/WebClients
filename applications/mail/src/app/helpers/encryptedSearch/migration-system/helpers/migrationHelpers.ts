import type { IDBPDatabase } from 'idb';

import type { ESCiphertext, EncryptedSearchDB } from '@proton/encrypted-search/models';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import type { CleanTextFn, EncryptedSearchData, MigrateFn } from '../interface';
import { createMigrations } from './contentMigrations';
import { getOutdatedContentIterator } from './contentVersionHelpers';
import { decryptESItem } from './decryptESItem';
import { encryptAndWriteESItem } from './encryptAndWriteESItem';

interface UpgradeContentProps {
    version: number;
    data: EncryptedSearchData;
    originalEncryptedData: ESCiphertext;
    esDB: IDBPDatabase<EncryptedSearchDB>;
    indexKey: CryptoKey;
    migrations: Map<number, MigrateFn>;
}

const upgradeContent = async ({
    version,
    data,
    originalEncryptedData,
    esDB,
    indexKey,
    migrations,
}: UpgradeContentProps): Promise<void> => {
    const migrate = migrations.get(version);

    let migratedData = data;
    if (migrate) {
        migratedData = migrate(data);
    }

    await encryptAndWriteESItem({
        esDB,
        indexKey,
        item: migratedData,
        originalEncryptedData,
    });
};

interface MigrateContentProps {
    esDB: IDBPDatabase<EncryptedSearchDB>;
    indexKey: CryptoKey;
    cleanText: CleanTextFn;
}

export const migrateContent = async ({ esDB, indexKey, cleanText }: MigrateContentProps) => {
    const migrations = createMigrations(cleanText);
    const versionsRecord: Record<number, number> = {};

    while (true) {
        const array = await getOutdatedContentIterator(esDB);
        if (array.length === 0) {
            break;
        }

        for (const data of array) {
            try {
                const decrypted = await decryptESItem({ esDB, indexKey, itemID: data.key });
                const hasVersion = data.value.version !== -1;

                console.count('updating');

                if (!decrypted) {
                    traceInitiativeError(
                        SentryMailInitiatives.MIGRATION_TOOL,
                        hasVersion
                            ? new Error('Failed to decrypt content with version')
                            : new Error('Failed to decrypt content without version')
                    );
                    continue;
                }

                const contentVersion = hasVersion ? data.value.version : decrypted.content?.version || -1;
                versionsRecord[contentVersion] = (versionsRecord[contentVersion] ?? 0) + 1;

                const version = hasVersion ? data.value.version : decrypted.content?.version || -1;
                await upgradeContent({
                    version,
                    esDB,
                    indexKey,
                    migrations,
                    data: decrypted,
                    originalEncryptedData: data.value,
                });
            } catch (error) {
                traceInitiativeError(SentryMailInitiatives.MIGRATION_TOOL, error);
                console.error(error);
            }
        }
    }

    console.log(`versionsRecord: ${JSON.stringify(versionsRecord)}`);
};
