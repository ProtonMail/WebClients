import type { IDBPDatabase } from 'idb';

import { decryptFromDB } from '@proton/encrypted-search/esHelpers';
import type { EncryptedSearchDB } from '@proton/encrypted-search/models';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import type { ESMessageContent } from 'proton-mail/models/encryptedSearch';

import type { CleanTextFn, MigrationMethod, PreparedMessageContent } from '../interface';
import { getMigrationArray } from './contentMigrations';
import { readNextOutdatedBatch } from './contentVersionHelpers';
import { encryptAndWriteESItems } from './encryptAndWriteESItems';

interface UpgradeContentProps {
    contentVersion: number;
    data: ESMessageContent;
    migrationArray: MigrationMethod[];
}

const upgradeContentArray = async ({ contentVersion, data, migrationArray }: UpgradeContentProps) => {
    const migrationsToRun = migrationArray
        .filter((data) => data.targetVersion > contentVersion)
        .sort((a, b) => a.targetVersion - b.targetVersion);

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
    let array = [];
    while ((array = await readNextOutdatedBatch(esDB)).length !== 0) {
        const items: PreparedMessageContent[] = (
            await Promise.all(
                array.map(async (data) => {
                    try {
                        const decrypted = await decryptFromDB<ESMessageContent>({
                            aesGcmCiphertext: data.value,
                            indexKey,
                            source: 'readContentItem',
                        });

                        const hasVersion = data.value.version !== -1;
                        const contentVersion = hasVersion ? data.value.version : decrypted?.version || -1;

                        const result = await upgradeContentArray({
                            contentVersion,
                            migrationArray,
                            data: decrypted,
                        });

                        return { updated: result, original: data.value, itemID: data.key };
                    } catch (error) {
                        traceInitiativeError(SentryMailInitiatives.MIGRATION_TOOL, error);
                        return null;
                    }
                })
            )
        ).filter((item) => item !== null);

        await encryptAndWriteESItems({ esDB, indexKey, items });
    }
};
