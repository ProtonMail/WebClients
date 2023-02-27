import { ApiImporterState } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import { ActiveImporter } from '@proton/activation/src/logic/importers/importers.interface';

import { getActiveImporterProgress } from './ImporterRow.helpers';

describe('ImporterRow.helpers', () => {
    it('Should return correct object for calendar imports', () => {
        const importer: ActiveImporter = {
            localID: 'id-Calendar',
            importerID: 'importerId',
            product: ImportType.CALENDAR,
            mapping: [],
            total: 0,
            processed: 0,
            importState: ApiImporterState.RUNNING,
            startDate: 0,
        };
        const res = getActiveImporterProgress(importer);

        expect(res).toStrictEqual({ total: 0, processed: 0 });
    });

    it('Should return correct object for contacts imports with 0 progress', () => {
        const importer: ActiveImporter = {
            localID: 'id-Contacts',
            importerID: 'importerId',
            product: ImportType.CONTACTS,
            mapping: [],
            total: 0,
            processed: 0,
            importState: ApiImporterState.RUNNING,
            startDate: 0,
        };
        const res = getActiveImporterProgress(importer);

        expect(res).toStrictEqual({ total: 0, processed: 0 });
    });

    it('Should return correct object for contacts imports with some progress', () => {
        const importer: ActiveImporter = {
            localID: 'id-Contacts',
            importerID: 'importerId',
            product: ImportType.CONTACTS,
            mapping: [],
            total: 100,
            processed: 101,
            importState: ApiImporterState.RUNNING,
            startDate: 0,
        };
        const res = getActiveImporterProgress(importer);

        expect(res).toStrictEqual({ total: 100, processed: 101 });
    });

    it('Should return correct object for mail imports with no progress', () => {
        const importer: ActiveImporter = {
            localID: 'id-Mail',
            importerID: 'importerId',
            product: ImportType.MAIL,
            mapping: [],
            total: 0,
            processed: 0,
            importState: ApiImporterState.RUNNING,
            startDate: 0,
        };
        const res = getActiveImporterProgress(importer);

        expect(res).toStrictEqual({ total: 0, processed: 0 });
    });

    it('Should return correct object for mail imports with some progress', () => {
        const importer: ActiveImporter = {
            localID: 'id-Mail',
            importerID: 'importerId',
            product: ImportType.MAIL,
            mapping: [
                {
                    SourceFolder: 'a',
                    Processed: 10,
                    Total: 100,
                },
                {
                    SourceFolder: 'b',
                    Processed: 20,
                    Total: 100,
                },
                {
                    SourceFolder: 'c',
                    Processed: 30,
                    Total: 100,
                },
                {
                    SourceFolder: 'd',
                    Processed: 40,
                    Total: 100,
                },
                {
                    SourceFolder: 'e',
                    Processed: 50,
                    Total: 100,
                },
                {
                    SourceFolder: 'f',
                    Processed: 60,
                    Total: 100,
                },
            ],
            total: 0,
            processed: 0,
            importState: ApiImporterState.RUNNING,
            startDate: 0,
        };
        const res = getActiveImporterProgress(importer);

        expect(res).toStrictEqual({ total: 600, processed: 210 });
    });
});
