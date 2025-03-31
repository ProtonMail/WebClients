import { MAX_BATCH_PER_IMPORT_REQUEST } from '@proton/pass/constants';
import type { ImportPayload, ImportProvider } from '@proton/pass/lib/import/types';
import type { ItemImportIntent, MaybeNull } from '@proton/pass/types';
import capitalize from '@proton/utils/capitalize';

export type ImportReport = {
    /** Optional error in case abort failed or aborted */
    error?: string;
    /** List of ignored items that could not be imported */
    ignored: string[];
    /** List of ignored files that coult not be imported */
    ignoredFiles?: string[];
    importedAt: number;
    provider: ImportProvider;
    /** Total number of items successfully imported. Total items
     * in import can be derived via : `total + ignored.length` */
    total: number;
    /** Total files in import request. The total number of
     * files successfully imported can be derived via :
     * `totalFiles - ignoredFiles.length` */
    totalFiles?: number;
    warnings?: string[];
};

export type ImportCounts = { totalItems: number; totalFiles: number };
export type ImportProgress = ImportCounts & { step: 'items' | 'files' };

export const getImportCounts = (data: ImportPayload): ImportCounts =>
    data.vaults.reduce<ImportCounts>(
        (counts, { items }) => {
            counts.totalItems += items.length;
            items.forEach(({ files }) => {
                counts.totalFiles += files?.length ?? 0;
            });

            return counts;
        },
        { totalItems: 0, totalFiles: 0 }
    );

/** Import progress rogress calculation:
 * - Each file = one unit of work
 * - Items are processed in batches (MAX_BATCH_PER_IMPORT_REQUEST)
 * - We count how many batches of items have been processed + how many files */
export const computeProgress = (progress: MaybeNull<ImportProgress>, itemProgress: number, fileProgress: number) => {
    if (!progress) return null;

    const { totalItems, totalFiles, step } = progress;

    const totalItemBatches = Math.ceil(totalItems / MAX_BATCH_PER_IMPORT_REQUEST);
    const totalImportUnits = totalItemBatches + totalFiles;

    if (totalImportUnits === 0) return 100;

    switch (step) {
        case 'items':
            /** During items phase: show completed item batches as percentage of total work */
            const completedItemBatches = Math.ceil(itemProgress / MAX_BATCH_PER_IMPORT_REQUEST);
            return Math.round((completedItemBatches / totalImportUnits) * 100);

        case 'files':
            /** During files phase: Add completed item batches to current file progress */
            return Math.round(((totalItemBatches + fileProgress) / totalImportUnits) * 100);

        default:
            return null;
    }
};

export const formatIgnoredItem = (item: ItemImportIntent) => `[${capitalize(item.type)}] ${item.metadata.name}`;
