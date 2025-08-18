import type { ApiImportListResponse, ApiImporter } from '@proton/activation/src/api/api.interface';
import type { ImportType } from '@proton/activation/src/interface';

import type { ActiveImporter, ActiveImportersMap, Importer, ImportersMap } from './importers.interface';

export const normalizeImporter = (apiImporter: ApiImporter) => {
    const importer: Importer = {
        ID: apiImporter.ID,
        account: apiImporter.Account,
        products: apiImporter.Product,
        provider: apiImporter.Provider,
        sasl: apiImporter.Sasl,
    };
    const activeImporters: ActiveImporter[] = [];

    if (apiImporter.Active) {
        Object.entries(apiImporter.Active).forEach(([product, value]) => {
            if (value) {
                const formattedReport: ActiveImporter = {
                    localID: `${importer.ID}-${product as ImportType}`,
                    importerID: importer.ID,
                    product: product as ImportType,
                    importState: value.State,
                    startDate: value.CreateTime,
                    errorCode: value.ErrorCode,
                    mapping: value.Mapping,
                    total: value.Total,
                };

                activeImporters.push(formattedReport);
            }
        });
    }

    return { importer, activeImporters };
};

export const normalizeImporters = (importersResponse: ApiImportListResponse) => {
    const imports: Importer[] = [];
    let activeImports: ActiveImporter[] = [];

    importersResponse.Importers.forEach((apiImporter) => {
        const { importer, activeImporters } = normalizeImporter(apiImporter);

        imports.push(importer);
        activeImports = activeImports.concat(activeImporters);
    });

    const importersMap = imports.reduce<ImportersMap>((acc, importer) => {
        acc[importer.ID] = importer;
        return acc;
    }, {});

    const activeImportersMap = activeImports.reduce<ActiveImportersMap>((acc, activeImporter) => {
        acc[activeImporter.localID] = activeImporter;
        return acc;
    }, {});

    return { importersMap, activeImportersMap };
};
