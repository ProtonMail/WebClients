import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import { mimeTypeToOpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { useFlagsDriveSheetODSImport } from '../../../../flags/useFlagsDriveSheetODSImport';
import type { DecryptedLink } from '../../../../store';
import { useDownloadScanFlag } from '../../../../store';
import { useIsSheetsEnabled } from '../../../../store/_documents/useDriveDocsSheetsFF';

export function useContextMenuItemsVisibility({ selectedLinks }: { selectedLinks: DecryptedLink[] }) {
    const isSheetsEnabled = useIsSheetsEnabled();
    const isODSImportEnabled = useFlagsDriveSheetODSImport();
    const isDownloadScanEnabled = useDownloadScanFlag();

    const firstLink = selectedLinks.length > 0 ? selectedLinks[0] : undefined;
    const isOnlyOneItem = selectedLinks.length === 1 && !!firstLink;
    const isOnlyOneFileItem = isOnlyOneItem && selectedLinks[0].isFile;

    const canShowPreview =
        isOnlyOneFileItem && !!firstLink.mimeType && isPreviewAvailable(firstLink.mimeType, firstLink.size);

    const protonDocuments = selectedLinks
        .map((link) => ({ link, docsType: mimeTypeToOpenInDocsType(link?.mimeType, isODSImportEnabled) }))
        .filter((item): item is { link: DecryptedLink; docsType: OpenInDocsType } => item.docsType !== undefined);

    // Only native Proton Docs can be opened in Docs on public pages (no conversion support)
    const nativeProtonDocuments = protonDocuments.filter((item) => item.docsType.isNative);

    const canOpenInDocs =
        isOnlyOneItem &&
        nativeProtonDocuments.length === 1 &&
        (nativeProtonDocuments[0].docsType.type === 'spreadsheet' ? isSheetsEnabled : true);

    const showDownloadDocument = isOnlyOneItem && nativeProtonDocuments.length === 1;
    const showDownloadScanButton = isDownloadScanEnabled && protonDocuments.length === 0;

    return {
        canShowPreview,
        canOpenInDocs,
        showDownloadDocument,
        showDownloadScanButton,
    };
}
