import {
    ImportersModel,
    ImportReportsModel,
    LegacyImportersModel, // Legacy
    ImportHistoriesModel, // Legacy
} from '@proton/shared/lib/models/importersModel';
import { Importer, ImportReportAggregated, NormalizedImporter } from '@proton/shared/lib/interfaces/EasySwitch';

/* Legacy Import Assistant */
import { ImportHistory } from '../containers/importAssistant/mail/interfaces';
import createUseModelHook from './helpers/createModelHook';

export const useImporters = createUseModelHook<Importer[]>(ImportersModel);
export const useImportReports = createUseModelHook<ImportReportAggregated[]>(ImportReportsModel);

/* Legacy Import Assistant */
export const useLegacyImporters = createUseModelHook<NormalizedImporter[]>(LegacyImportersModel);
export const useImportHistory = createUseModelHook<ImportHistory[]>(ImportHistoriesModel);
