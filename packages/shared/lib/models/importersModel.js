import { getImportsList, getImportReportsList } from '../api/easySwitch';
import { getMailImports, getMailImportReports } from '../api/mailImport';
import updateCollection from '../helpers/updateCollection';

export const getImportsModel = (api) => {
    return api(getImportsList())
        .then(({ Importers }) => Importers)
        .catch(() => []);
};

export const getImportReportsModel = (api) => {
    return api(getImportReportsList())
        .then(({ Reports }) => Reports)
        .catch(() => []);
};

export const ImportersModel = {
    key: 'Imports',
    get: getImportsModel,
    update: (model, events) =>
        updateCollection({
            model,
            events,
            item: ({ Importer }) => Importer,
            merge: (oldModel, newModel) => newModel,
        }),
};

export const ImportReportsModel = {
    key: 'ImportReports',
    get: getImportReportsModel,
    update: (model, events) =>
        updateCollection({
            model,
            events,
            item: ({ ImportReport }) => ImportReport,
        }),
};

/* Legacy Import Assistant */

export const getImportersModel = (api) => {
    return api(getMailImports())
        .then(({ Importers }) => Importers)
        .catch(() => []);
};

export const getImportHistoriesModel = (api) => {
    return api(getMailImportReports())
        .then(({ Imports }) => Imports)
        .catch(() => []);
};

export const LegacyImportersModel = {
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
