import type { IDBPDatabase } from 'idb';

import type { ESCiphertext, EncryptedSearchDB } from '@proton/encrypted-search/models';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import type { CleanTextFn, EncryptedSearchData, MigrationMethod } from '../interface';
import { getMigrationArray } from './contentMigrations';
import { getOutdatedContentIterator } from './contentVersionHelpers';
import { decryptESItem } from './decryptESItem';
import { encryptAndWriteESItems } from './encryptAndWriteESItems';
import { getMigrationToRun } from './getMigrationToRun';

interface UpgradeContentProps {
    contentVersion: number;
    data: EncryptedSearchData;
    migrationArray: MigrationMethod[];
}

const upgradeContentArray = async ({ contentVersion, data, migrationArray }: UpgradeContentProps) => {
    const migrationsToRun = getMigrationToRun(contentVersion, migrationArray);
    if (migrationsToRun.length === 0) {
        return data;
    }

    let result = data;
    for (const migrate of migrationsToRun) {
        result = await migrate.fn(result);
    }

    return result;
};

interface MigrateContentProps {
    esDB: IDBPDatabase<EncryptedSearchDB>;
    indexKey: CryptoKey;
    cleanText: CleanTextFn;
}

export const migrateContent = async ({ esDB, indexKey, cleanText }: MigrateContentProps) => {
    const migrationArray = getMigrationArray(cleanText);

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

                const result = await upgradeContentArray({
                    contentVersion,
                    migrationArray,
                    data: decrypted,
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
