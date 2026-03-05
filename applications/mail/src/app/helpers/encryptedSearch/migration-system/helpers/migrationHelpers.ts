import type { IDBPDatabase } from 'idb';

import type { ESCiphertext, EncryptedSearchDB } from '@proton/encrypted-search/models';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import type { CONTENT_VERSION } from '../../esBuild';
import type { CleanTextFn, EncryptedSearchData, MigrateFn } from '../interface';
import { getMigrationMap } from './contentMigrations';
import { getOutdatedContentIterator } from './contentVersionHelpers';
import { decryptESItem } from './decryptESItem';
import { encryptAndWriteESItems } from './encryptAndWriteESItems';

interface UpgradeContentProps {
    contentVersion: number;
    data: EncryptedSearchData;
    originalEncryptedData: ESCiphertext;
    esDB: IDBPDatabase<EncryptedSearchDB>;
    indexKey: CryptoKey;
    migrationMap: Map<CONTENT_VERSION, MigrateFn>;
}

const upgradeContent = async ({
    contentVersion,
    data,
    migrationMap,
}: UpgradeContentProps): Promise<EncryptedSearchData> => {
    let result = data;
    for (const [targetVersion, migrate] of migrationMap) {
        if (targetVersion > contentVersion) {
            result = migrate(result);
        }
    }

    return result;
};

interface MigrateContentProps {
    esDB: IDBPDatabase<EncryptedSearchDB>;
    indexKey: CryptoKey;
    cleanText: CleanTextFn;
}

export const migrateContent = async ({ esDB, indexKey, cleanText }: MigrateContentProps) => {
    const migrationMap = getMigrationMap(cleanText);
    const versionsRecord: Record<number, number> = {};

    let array = [];
    while ((array = await getOutdatedContentIterator(esDB)).length !== 0) {
        const updatedItems: { original: ESCiphertext; updated: EncryptedSearchData }[] = [];
        for (const data of array) {
            try {
                const decrypted = await decryptESItem({ esDB, indexKey, itemID: data.key });
                const hasVersion = data.value.version !== -1;

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

                const result = await upgradeContent({
                    contentVersion,
                    esDB,
                    indexKey,
                    migrationMap,
                    data: decrypted,
                    originalEncryptedData: data.value,
                });

                updatedItems.push({ updated: result, original: data.value });
            } catch (error) {
                traceInitiativeError(SentryMailInitiatives.MIGRATION_TOOL, error);
                console.error(error);
            }
        }

        await encryptAndWriteESItems({ esDB, indexKey, items: updatedItems });
    }

    console.log(`versionsRecord: ${JSON.stringify(versionsRecord)}`);
};
