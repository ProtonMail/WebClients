import { queryMailImport, queryMailImportHistory } from '../api/mailImport';
import updateCollection from '../helpers/updateCollection';

export const getImportersModel = (api) => {
    return api(queryMailImport()).then(({ Importers }) => Importers);
};

export const getImportHistoryModel = (api) => {
    return api(queryMailImportHistory()).then(({ Imports }) => Imports);
};

export const ImportersModel = {
    key: 'Importers',
    get: getImportersModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Importers }) => Importers }),
};

export const ImportHistoryModel = {
    key: 'ImportHistory',
    get: getImportHistoryModel,
    update: (model, events) => updateCollection({ model, events, item: ({ ImportHistory }) => ImportHistory }),
};
