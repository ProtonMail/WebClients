import { ImportersModel, ImportReportsModel } from '@proton/shared/lib/models/importersModel';
import { Importer, ImportReportAggregated } from '@proton/shared/lib/interfaces/EasySwitch';

import createUseModelHook from './helpers/createModelHook';

export const useImporters = createUseModelHook<Importer[]>(ImportersModel);
export const useImportReports = createUseModelHook<ImportReportAggregated[]>(ImportReportsModel);
