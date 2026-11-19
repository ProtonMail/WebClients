import { ApiImportProvider, ApiImporterError, ApiImporterState } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import type { ActiveImporter, Importer } from '@proton/activation/src/logic/importers/importers.interface';

import { getImportingFolders } from './getImportingFolders';

const importer: Importer = {
    ID: 'importer-id',
    account: 'user@example.com',
    products: [ImportType.DRIVE],
    provider: ApiImportProvider.GOOGLE,
};

const buildDriveImport = (overrides: Partial<ActiveImporter> = {}) => ({
    importer,
    activeImporter: {
        localID: 'importer-id-Drive',
        importerID: 'importer-id',
        product: ImportType.DRIVE,
        importState: ApiImporterState.RUNNING,
        startDate: 1601053249,
        ...overrides,
    } satisfies ActiveImporter,
});

describe('getImportingFolders', () => {
    it('maps a running import to a placeholder row with its imported size', () => {
        expect(getImportingFolders([buildDriveImport({ importedBytes: 2048 })])).toEqual([
            {
                uid: 'drive-import-importer-id-Drive',
                name: 'google-drive-user',
                startTime: new Date(1601053249 * 1000),
                importedBytes: 2048,
                pausedImport: undefined,
            },
        ]);
    });

    it('counts 0 bytes while the API has not sent any size yet', () => {
        const [folder] = getImportingFolders([buildDriveImport()]);

        expect(folder.importedBytes).toBe(0);
    });

    it('keeps the importer and the pause reason of a paused import', () => {
        const [folder] = getImportingFolders([
            buildDriveImport({
                importState: ApiImporterState.PAUSED,
                errorCode: ApiImporterError.ERROR_CODE_IMAP_CONNECTION,
            }),
        ]);

        expect(folder.pausedImport).toEqual({ importer, errorCode: ApiImporterError.ERROR_CODE_IMAP_CONNECTION });
    });
});
