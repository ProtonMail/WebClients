import { type ApiImporterError, ApiImporterState } from '@proton/activation/src/api/api.interface';
import { getDriveImportFolderName } from '@proton/activation/src/components/Modals/OAuth/Drive/driveImportTask';
import type { ActiveImporter, Importer } from '@proton/activation/src/logic/importers/importers.interface';

export interface ImportingFolder {
    uid: string;
    name: string;
    startTime: Date;
    importedBytes: number;
    pausedImport?: { importer: Importer; errorCode?: ApiImporterError };
}

// The API only gives the import folder once the import is done --> a running import gets a placeholder row.
export const getImportingFolders = (
    driveImports: { activeImporter: ActiveImporter; importer: Importer }[]
): ImportingFolder[] =>
    driveImports.map(({ activeImporter, importer }) => {
        const { localID, startDate, importedBytes, importState, errorCode } = activeImporter;
        return {
            uid: `drive-import-${localID}`,
            name: getDriveImportFolderName(importer.account),
            startTime: new Date(startDate * 1000),
            importedBytes: importedBytes ?? 0,
            pausedImport: importState === ApiImporterState.PAUSED ? { importer, errorCode } : undefined,
        };
    });
