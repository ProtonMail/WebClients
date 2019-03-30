import { LabelsModel } from 'proton-shared/lib/models/labelsModel';
import createUseModelHook from './helpers/createModelHook';

export const useLabels = createUseModelHook(LabelsModel);
