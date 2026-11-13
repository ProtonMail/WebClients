import { type ApiImporterError, ApiImporterState } from '@proton/activation/src/api/api.interface';
import type { ActiveImporter, Importer } from '@proton/activation/src/logic/importers/importers.interface';
import { generateNodeUid } from '@proton/drive/sdk';

export interface ImportingFolder {
    uid: string;
    importedBytes: number;
    pausedImport?: { importer: Importer; errorCode?: ApiImporterError };
}

export const getImportingFolders = (
    driveImports: { activeImporter: ActiveImporter; importer: Importer }[]
): ImportingFolder[] =>
    driveImports.flatMap(({ activeImporter, importer }) => {
        const { importFolder, importedBytes, importState, errorCode } = activeImporter;
        if (!importFolder) {
            return [];
        }
        return [
            {
                uid: generateNodeUid(importFolder.volumeID, importFolder.linkID),
                importedBytes: importedBytes ?? 0,
                pausedImport: importState === ApiImporterState.PAUSED ? { importer, errorCode } : undefined,
            },
        ];
    });
