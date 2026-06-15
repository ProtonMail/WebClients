import { ImportType } from '@proton/activation/src/interface';

import { deleteImportReport, getDriveImportData } from './api';

describe('activation api route builders', () => {
    describe('deleteImportReport', () => {
        const reportID = 'report-123';

        it('returns the per-product delete route for each import type', () => {
            expect(deleteImportReport(reportID, ImportType.MAIL)).toStrictEqual({
                url: `importer/v1/mail/importers/reports/${reportID}`,
                method: 'delete',
            });
            expect(deleteImportReport(reportID, ImportType.CALENDAR)).toStrictEqual({
                url: `importer/v1/calendar/importers/reports/${reportID}`,
                method: 'delete',
            });
            expect(deleteImportReport(reportID, ImportType.CONTACTS)).toStrictEqual({
                url: `importer/v1/contacts/importers/reports/${reportID}`,
                method: 'delete',
            });
            expect(deleteImportReport(reportID, ImportType.DRIVE)).toStrictEqual({
                url: `importer/v1/drive/importers/reports/${reportID}`,
                method: 'delete',
            });
        });
    });

    describe('getDriveImportData', () => {
        it('targets the drive importer endpoint', () => {
            expect(getDriveImportData('importer-1')).toStrictEqual({
                url: 'importer/v1/drive/importers/importer-1',
                method: 'GET',
            });
        });
    });
});
