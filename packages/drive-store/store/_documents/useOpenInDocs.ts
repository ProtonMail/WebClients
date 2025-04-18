import {
    isConvertibleToProtonSheet,
    isProtonDocsConvertible,
    isProtonDocument,
    isProtonSheet,
} from '@proton/shared/lib/helpers/mimetype';

import type { DecryptedLink } from '../_links';
import { useDocumentActions } from './useDocumentActions';
import { useDriveDocsFeatureFlag } from './useDriveDocsFeatureFlag';
import { useDriveDocsSheetsFF } from './useDriveDocsSheetsFF';

export const useOpenInDocs = (link: Pick<DecryptedLink, 'mimeType' | 'parentLinkId'> | undefined) => {
    const { openDocument, convertDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { isSheetsEnabled } = useDriveDocsSheetsFF();

    const mimeType = link?.mimeType || '';

    const isDocument = isProtonDocument(mimeType);
    const isSheet = isProtonSheet(mimeType);

    // Docs tries to convert by creating a node in the parent folder.
    // If the link doesn't have a parent, it means we don't have access to it.
    const hasParent = !!link?.parentLinkId;
    const isConvertibleToSheet = isSheetsEnabled && isConvertibleToProtonSheet(mimeType);
    const isConvertibleDocument = (isProtonDocsConvertible(mimeType) || isConvertibleToSheet) && hasParent;

    const canShowOpenInDocsForSheet = isSheetsEnabled && isSheet;
    const showOpenInDocs = isDocsEnabled && (isDocument || canShowOpenInDocsForSheet || isConvertibleDocument);

    const openInDocsAction = async (
        doc: { shareId: string; linkId: string },
        openBehavior: 'tab' | 'redirect' = 'tab'
    ) => {
        if (isDocument || isSheet) {
            await openDocument({ ...doc, type: isDocument ? 'doc' : 'sheet', openBehavior });
        } else if (isConvertibleDocument) {
            await convertDocument({
                ...doc,
                type: isConvertibleToProtonSheet(mimeType) ? 'sheet' : 'doc',
            });
        }
    };

    return {
        showOpenInDocs,
        openInDocsAction,
    };
};
