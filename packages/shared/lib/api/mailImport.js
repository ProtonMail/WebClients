// Manage imports of user emails from external providers
export const queryMailImport = () => ({
    url: 'mail/v4/importers',
    method: 'get',
});

export const getAuthenticationMethod = (params) => ({
    url: 'mail/v4/importers/authinfo',
    method: 'get',
    params,
});

export const getMailImport = (importID, params) => ({
    url: `mail/v4/importers/${importID}`,
    method: 'get',
    params,
});

export const getMailImportFolders = (importID, params) => ({
    url: `mail/v4/importers/${importID}/folders`,
    method: 'get',
    params,
});

export const queryMailImportHistory = () => ({
    url: 'mail/v4/importers/reports',
    method: 'get',
});

export const deleteMailImportReport = (reportID) => ({
    url: `mail/v4/importers/reports/${reportID}`,
    method: 'delete',
});

export const createMailImport = (data) => ({
    url: 'mail/v4/importers',
    method: 'post',
    data,
});

export const updateMailImport = (importID, data) => ({
    url: `mail/v4/importers/${importID}`,
    method: 'put',
    data,
});

export const resumeMailImport = (importID) => ({
    url: `mail/v4/importers/${importID}/resume`,
    method: 'put',
});

export const cancelMailImport = (importID) => ({
    url: `mail/v4/importers/${importID}/cancel`,
    method: 'put',
});

export const createJobImport = (importID, data) => ({
    url: `mail/v4/importers/${importID}`,
    method: 'post',
    data,
});

export const deleteMailImport = (importID) => ({
    url: `mail/v4/importers/${importID}`,
    method: 'delete',
});

export const deleteSource = (importID) => ({
    url: `mail/v4/importers/reports/${importID}/deletesource`,
    method: 'put',
});
