import { ImportersModel, ImportHistoryModel } from 'proton-shared/lib/models/importersModel';
import createUseModelHook from './helpers/createModelHook';

export const useImporters = createUseModelHook(ImportersModel);
export const useImportHistory = createUseModelHook(ImportHistoryModel);
