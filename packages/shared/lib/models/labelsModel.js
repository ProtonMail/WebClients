import { getLabels, getFolders, getContactGroup } from '../api/labels';
import updateCollection from '../helpers/updateCollection';

const extractLabels = ({ Labels = [] }) => Labels;

export const getLabelsModel = async (api) => {
    const [labels = [], folders = [], contactGroups = []] = await Promise.all([
        api(getLabels()).then(extractLabels),
        api(getFolders()).then(extractLabels),
        api(getContactGroup()).then(extractLabels)
    ]);
    return [...labels, ...folders, ...contactGroups];
};

export const LabelsModel = {
    key: 'Labels',
    get: getLabelsModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Label }) => Label, merge: (a, b) => b })
};
