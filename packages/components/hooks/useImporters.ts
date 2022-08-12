import { ImportReportAggregated, Importer } from '@proton/shared/lib/interfaces/EasySwitch';
import { ImportReportsModel, ImportersModel } from '@proton/shared/lib/models/importersModel';

import createUseModelHook from './helpers/createModelHook';

export const useImporters = createUseModelHook<Importer[]>(ImportersModel);
export const useImportReports = createUseModelHook<ImportReportAggregated[]>(ImportReportsModel);
