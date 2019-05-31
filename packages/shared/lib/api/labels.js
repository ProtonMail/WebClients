import { LABEL_TYPE } from '../constants';

const { LABEL, CONTACT_GROUP } = LABEL_TYPE;

export const get = (Type) => ({
    url: 'labels',
    method: 'get',
    params: { Type }
});

export const order = ({ LabelIDs, Type }) => ({
    method: 'put',
    url: 'labels/order',
    data: { LabelIDs, Type }
});

export const create = ({ Name, Color, Display, Type, Exclusive, Notify }) => ({
    method: 'post',
    url: 'labels',
    data: { Name, Color, Display, Type, Exclusive, Notify }
});

export const updateLabel = (labelID, { Name, Color, Display, Notify }) => ({
    method: 'put',
    url: `labels/${labelID}`,
    data: { Name, Color, Display, Notify }
});

export const deleteLabel = (labelID) => ({
    method: 'delete',
    url: `labels/${labelID}`
});

export const getLabels = () => get(LABEL);
export const getContactGroup = () => get(CONTACT_GROUP);

export const orderLabels = (opt) => order({ ...opt, Type: LABEL });
export const orderContactGroup = (opt) => order({ ...opt, Type: CONTACT_GROUP });

export const createLabel = (opt) => create({ ...opt, Type: LABEL });
export const createContactGroup = (opt) => create({ ...opt, Type: CONTACT_GROUP });
