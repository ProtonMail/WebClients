// Manage imports of user emails from external providers
export const queryMailImport = () => ({
    url: 'mail/import',
    method: 'get'
});

export const queryMailImportCurrent = () => ({
    url: 'mail/import/current',
    method: 'get'
});

export const queryMailImportReport = () => ({
    url: 'mail/import/report',
    method: 'get'
});

export const getMailImport = (importID) => ({
    url: `mail/import/${importID}`,
    method: 'get'
});

export const getMailImportFolders = (importID) => ({
    url: `mail/import/${importID}/folders`,
    method: 'get'
});

export const getAuthenticationMethod = (params) => ({
    url: 'mail/import/authinfo',
    method: 'get',
    params
});

export const downloadMailImportReport = (reportID) => ({
    url: `mail/import/report/${reportID}/download`,
    method: 'get'
});

export const deleteMailImportReport = (reportID) => ({
    url: `mail/import/report/${reportID}`,
    method: 'delete'
});

export const createMailImport = (data) => ({
    url: 'mail/import',
    method: 'post',
    data
});

export const updateMailImport = (importID, data) => ({
    url: `mail/import/${importID}`,
    method: 'put',
    data
});

export const resumeMailImport = (importID) => ({
    url: `mail/import/${importID}/resume`,
    method: 'put'
});

export const cancelMailImport = (importID) => ({
    url: `mail/import/${importID}/cancel`,
    method: 'put'
});

export const createJobImport = (importID, data) => ({
    url: `mail/import/${importID}`,
    method: 'post',
    data
});

export const deleteMailImport = (importID) => ({
    url: `mail/import/${importID}`,
    method: 'delete'
});
