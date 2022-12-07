import { getImportReportsList, getImportsList } from '@proton/activation/api';

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
            itemKey: 'Importer',
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
            itemKey: 'ImportReport',
        }),
};
