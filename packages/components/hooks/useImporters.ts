import { ImportersModel, ImportHistoriesModel } from 'proton-shared/lib/models/importersModel';
import { Importer, ImportHistory } from '../containers/mail/import/interfaces';
import createUseModelHook from './helpers/createModelHook';

export const useImporters = createUseModelHook<Importer[]>(ImportersModel);
export const useImportHistory = createUseModelHook<ImportHistory[]>(ImportHistoriesModel);
