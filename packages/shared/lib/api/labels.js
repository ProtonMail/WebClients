export const getLabels = (type) => ({
    method: 'get',
    url: `labels/${type}`
});

export const createLabel = ({ Name, Color, Display, Type, Exclusive, Notify }) => ({
    method: 'post',
    url: 'labels',
    data: { Name, Color, Display, Type, Exclusive, Notify }
});

export const orderLabel = ({ LabelIDs, Type }) => ({
    method: 'put',
    url: 'labels/order',
    data: { LabelIDs, Type }
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
