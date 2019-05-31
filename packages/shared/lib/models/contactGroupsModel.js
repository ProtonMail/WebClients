import { getContactGroup } from '../api/labels';
import updateCollection from '../helpers/updateCollection';

export const getContactGroupsModel = (api) => {
    return api(getContactGroup()).then(({ Labels }) => Labels);
};

export const ContactGroupsModel = {
    key: 'Labels',
    get: getContactGroupsModel,
    update: (model, events) => updateCollection(model, events, 'Label')
};
