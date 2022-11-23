import { getContactGroup, getFolders, getLabels, getSystemFolders } from '../api/labels';
import updateCollection from '../helpers/updateCollection';

const extractLabels = ({ Labels = [] }) => Labels;

export const getLabelsModel = async (api) => {
    const [labels = [], folders = [], contactGroups = [], systemFolders = []] = await Promise.all([
        api(getLabels()).then(extractLabels),
        api(getFolders()).then(extractLabels),
        api(getContactGroup()).then(extractLabels),
        api(getSystemFolders()).then(extractLabels),
    ]);
    return [...labels, ...folders, ...contactGroups, ...systemFolders];
};

export const LabelsModel = {
    key: 'Labels',
    get: getLabelsModel,
    update: (model, events) => updateCollection({ model, events, itemKey: 'Label', merge: (a, b) => b }),
};
