// Manage imports of user emails from external providers
export const createMailImport = (data) => ({
    url: 'mail/v4/importers',
    method: 'post',
    data,
});

export const getMailImports = () => ({
    url: 'mail/v4/importers',
    method: 'get',
});

export const getMailImport = (importID, params) => ({
    url: `mail/v4/importers/${importID}`,
    method: 'get',
    params,
});

export const updateMailImport = (importID, data) => ({
    url: `mail/v4/importers/${importID}`,
    method: 'put',
    data,
});

export const deleteMailImport = (importID) => ({
    url: `mail/v4/importers/${importID}`,
    method: 'delete',
});

export const startMailImportJob = (importID, data) => ({
    url: `mail/v4/importers/${importID}`,
    method: 'post',
    data,
});

export const resumeMailImportJob = (importID) => ({
    url: `mail/v4/importers/${importID}/resume`,
    method: 'put',
});

export const cancelMailImportJob = (importID) => ({
    url: `mail/v4/importers/${importID}/cancel`,
    method: 'put',
});

export const getMailImportFolders = (importID, params) => ({
    url: `mail/v4/importers/${importID}/folders`,
    method: 'get',
    params,
});

export const getMailImportReports = () => ({
    url: 'mail/v4/importers/reports',
    method: 'get',
});

export const deleteMailImportReport = (reportID) => ({
    url: `mail/v4/importers/reports/${reportID}`,
    method: 'delete',
});

export const getAuthenticationMethod = (params) => ({
    url: 'mail/v4/importers/authinfo',
    method: 'get',
    params,
});

export const deleteSource = (importID) => ({
    url: `mail/v4/importers/reports/${importID}/deletesource`,
    method: 'put',
});
