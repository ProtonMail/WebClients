const TYPE = {
    LABEL: 1,
    CONTACT_GROUP: 2
};

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

export const getLabels = () => get(TYPE.LABEL);
export const getContactGroup = () => get(TYPE.CONTACT_GROUP);

export const orderLabels = (opt) => order({ ...opt, Type: TYPE.LABEL });
export const orderContactGroup = (opt) => order({ ...opt, Type: TYPE.CONTACT_GROUP });

export const createLabel = (opt) => create({ ...opt, Type: TYPE.LABEL });
export const createContactGroup = (opt) => create({ ...opt, Type: TYPE.CONTACT_GROUP });
