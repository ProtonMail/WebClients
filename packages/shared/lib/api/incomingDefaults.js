export const getIncomingDefaults = ({ Location, Page = 0, PageSize = 100, Keyword } = {}) => ({
    method: 'get',
    url: 'incomingdefaults',
    params: { Location, Page, PageSize, Keyword }
});

export const addIncomingDefault = ({ Email, Domain, Location } = {}) => ({
    method: 'post',
    url: 'incomingdefaults',
    data: { Email, Domain, Location }
});

export const updateIncomingDefault = (incomingDefaultID, { Email, Domain, Location } = {}) => ({
    method: 'put',
    url: `incomingdefaults/${incomingDefaultID}`,
    data: { Email, Domain, Location }
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
