import { getLabels } from '../api/labels';
import updateCollection from '../helpers/updateCollection';
import { LABEL_TYPES } from '../constants';

export const getLabelsModel = (api) => {
    return api(getLabels()).then(({ Labels }) => Labels);
};

export const LabelsModel = {
    key: 'Labels',
    get: getLabelsModel,
    update: (model, events) => updateCollection(model, events, 'Label')
};

const defaultMap = (label) => ({ key: label.Name, value: label });

export function factory(list = [], { formatMapLabel = defaultMap, formatMapFolder = defaultMap } = {}) {
    const { folders, labels, mapLabels, mapFolders } = list.reduce(
        (acc, label) => {
            if (label.Exclusive === LABEL_TYPES.LABEL) {
                const { key, value } = formatMapLabel(label);
                acc.mapLabels[key] = value;
                acc.labels.push(label);
                return acc;
            }

            const { key, value } = formatMapFolder(label);
            acc.mapFolders[key] = value;
            acc.folders.push(label);
            return acc;
        },
        { folders: [], labels: [], mapLabels: Object.create(null), mapFolders: Object.create(null) }
    );

    const getFolders = () => folders;
    const getLabels = () => labels;
    const getLabelsMap = () => mapLabels;
    const getFoldersMap = () => mapFolders;

    return {
        getLabels,
        getFolders,
        getLabelsMap,
        getFoldersMap
    };
}
