import { LabelsModel, factory } from 'proton-shared/lib/models/labelsModel';
import createUseModelHook from './helpers/createModelHook';

export const useLabels = createUseModelHook(LabelsModel);

export const useFormattedLabels = () => {
    const [labels = [], loading] = useLabels();
    return [factory(labels), loading];
};
