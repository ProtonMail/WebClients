import { queryMailImport, queryMailImportHistory } from '../api/mailImport';
import updateCollection from '../helpers/updateCollection';

export const getImportersModel = (api) => {
    return api(queryMailImport()).then(({ Importers }) => Importers);
};

export const getImportHistoriesModel = (api) => {
    return api(queryMailImportHistory()).then(({ Imports }) => Imports);
};

export const ImportersModel = {
    key: 'Importers',
    get: getImportersModel,
    update: (model, events) =>
        updateCollection({
            model,
            events,
            item: ({ Importer }) => Importer,
            merge: (oldModel, newModel) => newModel,
        }),
};

export const ImportHistoriesModel = {
    key: 'ImportHistories',
    get: getImportHistoriesModel,
    update: (model, events) =>
        updateCollection({
            model,
            events,
            item: ({ ImportHistory }) => ImportHistory,
        }),
};
