export const getIncomingDefaults = ({ Location, Page = 0, PageSize = 100, Keyword } = {}) => ({
    method: 'get',
    url: 'incomingdefaults',
    params: { Location, Page, PageSize, Keyword }
});

export const addIncomingDefault = ({ Email, Location } = {}) => ({
    method: 'post',
    url: 'incomingdefaults',
    data: { Email, Location }
});

export const updateIncomingDefault = (incomingDefaultID, { Location } = {}) => ({
    method: 'put',
    url: `incomingdefaults/${incomingDefaultID}`,
    data: { Location }
});

export const deleteIncomingDefaults = (IDs) => ({
    method: 'put',
    url: 'incomingdefaults/delete',
    data: { IDs }
});

export const clearIncomingDefaults = () => ({
    method: 'delete',
    url: 'incomingdefaults'
});
