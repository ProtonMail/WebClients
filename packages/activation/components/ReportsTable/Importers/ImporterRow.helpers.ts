import { ImportType } from '@proton/activation/interface';
import { ActiveImporter } from '@proton/activation/logic/importers/importers.interface';

export const getActiveImporterProgress = (activeImporter: ActiveImporter) => {
    const { product, mapping, total, processed } = activeImporter;
    if (product === ImportType.MAIL && mapping) {
        return mapping.reduce<{ total: number; processed: number }>(
            (acc, { Total = 0, Processed = 0 }) => {
                acc.total += Total;
                acc.processed += Processed;
                return acc;
            },
            { total: 0, processed: 0 }
        );
    }

    if (product === ImportType.CONTACTS) {
        return { total: total || 0, processed: processed || 0 };
    }

    return { total: 0, processed: 0 };
};
