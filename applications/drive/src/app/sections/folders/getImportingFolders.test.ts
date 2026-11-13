import { ApiImportProvider, ApiImporterError, ApiImporterState } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import type { ActiveImporter, Importer } from '@proton/activation/src/logic/importers/importers.interface';
import { generateNodeUid } from '@proton/drive/sdk';

import { getImportingFolders } from './getImportingFolders';

const importer: Importer = {
    ID: 'importer-id',
    account: 'user@example.com',
    products: [ImportType.DRIVE],
    provider: ApiImportProvider.GOOGLE,
};

const buildDriveImport = (overrides: Partial<ActiveImporter>) => ({
    importer,
    activeImporter: {
        localID: 'importer-id-Drive',
        importerID: 'importer-id',
        product: ImportType.DRIVE,
        importState: ApiImporterState.RUNNING,
        startDate: 1601053249,
        importFolder: { volumeID: 'volume-id', linkID: 'link-id' },
        ...overrides,
    } satisfies ActiveImporter,
});

describe('getImportingFolders', () => {
    it('maps a running import to its folder and imported size', () => {
        expect(getImportingFolders([buildDriveImport({ importedBytes: 2048 })])).toEqual([
            { uid: generateNodeUid('volume-id', 'link-id'), importedBytes: 2048, pausedImport: undefined },
        ]);
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

    it('skips an import whose folder is not known yet', () => {
        expect(getImportingFolders([buildDriveImport({ importFolder: undefined })])).toEqual([]);
    });
});
