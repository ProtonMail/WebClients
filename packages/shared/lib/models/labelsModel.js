import { getLabels } from '../api/labels';
import updateCollection from '../helpers/updateCollection';

export const getLabelsModel = (api) => {
    return api(getLabels()).then(({ Labels }) => Labels);
};

export const LabelsModel = {
    key: 'Labels',
    get: getLabelsModel,
    update: (model, events) => updateCollection(model, events, 'Label')
};
