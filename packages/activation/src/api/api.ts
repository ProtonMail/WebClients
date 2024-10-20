import type { CreateImportPayload, EASY_SWITCH_SOURCES, LaunchImportPayload, OAuthProps } from '../interface';
import { ImportType } from '../interface';

export const getTokens = () => ({
    url: 'oauth-token/v1/tokens',
    method: 'get',
});

export const createToken = (
    data: OAuthProps & {
        Products: ImportType[];
        Source: EASY_SWITCH_SOURCES;
    }
) => ({
    url: 'oauth-token/v1/tokens',
    method: 'post',
    data,
});

export const createSync = (importerID: string) => ({
    url: 'importer/v1/sync',
    method: 'POST',
    data: { ImporterID: importerID, Product: 'Mail' },
});

export const getSyncList = () => ({
    url: 'importer/v1/sync',
    method: 'get',
});

export const resumeSync = (syncId: string) => ({
    url: `importer/v1/sync/${syncId}/resume`,
    method: 'put',
});

export const deleteSync = (syncId: String) => ({
    url: `importer/v1/sync/${syncId}`,
    method: 'DELETE',
});

export const createImport = (data: CreateImportPayload) => ({
    url: 'importer/v1/importers',
    method: 'post',
    data,
});

export const getImport = (importerID: string) => ({
    url: `importer/v1/importers/${importerID}`,
    method: 'get',
});

export const updateImport = (importerID: string, data: CreateImportPayload) => ({
    url: `importer/v1/importers/${importerID}`,
    method: 'put',
    data,
});

export const startImportTask = (data: LaunchImportPayload) => ({
    url: 'importer/v1/importers/start',
    method: 'post',
    data,
});

export const getImportsList = () => ({
    url: 'importer/v1/importers',
    method: 'get',
});

export const getImportReportsList = () => ({
    url: 'importer/v1/reports',
    method: 'get',
});

export const getMailImportData = (
    importerID: string,
    params?: {
        Code: string;
    }
) => ({
    url: `importer/v1/mail/importers/${importerID}`,
    method: 'get',
    params,
});

export const getAuthenticationMethod = (params: { Email: string }) => ({
    url: 'importer/v1/mail/importers/authinfo',
    method: 'get',
    params,
});

export const getCalendarImportData = (importerID: string) => ({
    url: `importer/v1/calendar/importers/${importerID}`,
    method: 'get',
});

export const getContactsImportData = (importerID: string) => ({
    url: `importer/v1/contacts/importers/${importerID}`,
    method: 'get',
});

export const deleteImportReport = (reportID: string, importType: ImportType) => {
    const method = 'delete';

    switch (importType) {
        case ImportType.MAIL:
            return { url: `importer/v1/mail/importers/reports/${reportID}`, method };
        case ImportType.CALENDAR:
            return { url: `importer/v1/calendar/importers/reports/${reportID}`, method };
        case ImportType.CONTACTS:
            return { url: `importer/v1/contacts/importers/reports/${reportID}`, method };
    }
};

export const cancelImport = (data: { ImporterID: string; Products: ImportType[] }) => ({
    url: 'importer/v1/importers/cancel',
    method: 'put',
    data,
});

export const resumeImport = (data: { ImporterID: string; Products: ImportType[] }) => ({
    url: 'importer/v1/importers/resume',
    method: 'put',
    data,
});

export const rollbackImport = (reportID: string, Products: ImportType[]) => ({
    url: `importer/v1/reports/${reportID}/undo`,
    method: 'POST',
    data: { Products },
});
