import { isTimepointSmaller } from '@proton/encrypted-search/esHelpers';
import { readSortedIDs } from '@proton/encrypted-search/esIDB';
import type { ESTimepoint } from '@proton/encrypted-search/models';

import { allContentHasVersion } from './helpers/allContentHasVersion';
import { encryptAndWriteESItem } from './helpers/encryptAndWriteESItem';
import { getDecryptedESItems } from './helpers/getDecryptedESItems';
import { CONTENT_EXTRACTION_MAX_RETRIES, type DBType } from './interface';

const BATCH_SIZE = 10;

export class ContentVersionExtractor {
    private userID: string;
    private esDB: DBType;
    private indexKey: CryptoKey;

    constructor(userID: string, esDB: DBType, indexKey: CryptoKey) {
        this.userID = userID;
        this.esDB = esDB;
        this.indexKey = indexKey;
    }

    private async saveCheckpoint(timepoint: ESTimepoint) {
        try {
            await this.esDB.put('config', timepoint, 'contentVersionMigrationCheckpoint');
        } catch (error) {
            console.warn('Failed to save migration checkpoint:', error);
        }
    }

    private async clearCheckpoint() {
        try {
            await this.esDB.delete('config', 'contentVersionMigrationCheckpoint');
        } catch (error) {
            console.warn('Failed to clear migration checkpoint:', error);
        }
    }

    private async markMigrationCompleted() {
        await this.clearCheckpoint();
        await this.esDB.put('config', true, 'contentVersionMigrationCompleted');
        await this.esDB.put('config', 0, 'contentVersionMigrationRetries');
    }

    async markMigrationAbandoned() {
        await this.clearCheckpoint();
        await this.esDB.put('config', true, 'contentVersionMigrationAbandoned');
    }

    async getLatestCheckpoint() {
        try {
            const checkpoint = await this.esDB.get('config', 'contentVersionMigrationCheckpoint');
            return checkpoint || undefined;
        } catch (error) {
            return undefined;
        }
    }

    async didReachMaxRetries() {
        const retryCount = (await this.esDB.get('config', 'contentVersionMigrationRetries')) || 0;
        if (retryCount >= CONTENT_EXTRACTION_MAX_RETRIES) {
            return true;
        }

        return false;
    }

    async validateAllContentMigrated() {
        const isAllContentMigrated = await allContentHasVersion({ esDB: this.esDB });
        if (isAllContentMigrated) {
            await this.markMigrationCompleted();
            return true;
        }

        return false;
    }

    async incrementRetryCount() {
        const retryCount = (await this.esDB.get('config', 'contentVersionMigrationRetries')) || 0;
        await this.esDB.put('config', retryCount + 1, 'contentVersionMigrationRetries');
    }

    async runMigrationPass(lastCheckpoint?: ESTimepoint) {
        const allMetadataIDs = await readSortedIDs(this.userID, false, lastCheckpoint);
        if (!allMetadataIDs || allMetadataIDs.length === 0) {
            await this.markMigrationCompleted();
            return;
        }

        let completedSuccessfully = true;

        for (let i = 0; i < allMetadataIDs.length; i += BATCH_SIZE) {
            const batch = allMetadataIDs.slice(i, i + BATCH_SIZE);

            try {
                const batchData = await getDecryptedESItems({
                    esDB: this.esDB,
                    contentIDs: batch,
                    indexKey: this.indexKey,
                });

                if (batchData && batchData.length > 0) {
                    for (const item of batchData) {
                        if (item) {
                            await encryptAndWriteESItem({ esDB: this.esDB, indexKey: this.indexKey, item });
                        }
                    }

                    const lastSuccessfulItem = batchData
                        .filter((item) => item?.timepoint)
                        .sort((a, b) => {
                            return isTimepointSmaller(a.timepoint!, b.timepoint!) ? 1 : -1;
                        })
                        .at(0);

                    if (lastSuccessfulItem) {
                        await this.saveCheckpoint(lastSuccessfulItem.timepoint!);
                    }
                }
            } catch (error) {
                console.warn('Batch processing failed, will resume from last checkpoint on next run:', error);
                completedSuccessfully = false;
                break;
            }
        }

        if (completedSuccessfully) {
            await this.clearCheckpoint();
        }
    }
}
