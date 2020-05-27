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

export const getAuthenticationMethod = (params) => ({
    url: 'mail/import/authinfo',
    method: 'get',
    params
});

export const downloadMailImportReport = (reportID) => ({
    url: `mail/import/report/${reportID}/download`,
    method: 'get'
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
    url: `mail/import/${importID}/job`,
    method: 'post',
    data
});

export const getJobImport = (importID, jobID) => ({
    url: `mail/import/${importID}/job/${jobID}`,
    method: 'get'
});

export const updateJobImport = (importID, jobID, data) => ({
    url: `mail/import/${importID}/job/${jobID}`,
    method: 'put',
    data
});

export const deleteJobImport = (importID, jobID) => ({
    url: `mail/import/${importID}/job/${jobID}`,
    method: 'delete'
});

export const deleteMailImport = (importID) => ({
    url: `mail/import/${importID}`,
    method: 'delete'
});
