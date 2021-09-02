import { getMailImports, getMailImportReports } from '../api/mailImport';
import updateCollection from '../helpers/updateCollection';

export const getImportersModel = (api) => {
    return api(getMailImports()).then(({ Importers }) => Importers).catch(() => []);;
};

export const getImportHistoriesModel = (api) => {
    return api(getMailImportReports()).then(({ Imports }) => Imports).catch(() => []);
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
