import { isProtonDocsConvertible, isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import { DecryptedLink } from '../_links';
import { useDocumentActions } from './useDocumentActions';
import { useDriveDocsFeatureFlag } from './useDriveDocsFeatureFlag';

export const useOpenInDocs = (link: DecryptedLink | undefined) => {
    const { openDocument, convertDocument } = useDocumentActions();
    const isDocsEnabled = useDriveDocsFeatureFlag();

    const mimeType = link?.mimeType || '';

    const isDocument = isProtonDocument(mimeType);

    // Docs tries to convert by creating a node in the parent folder.
    // If the link doesn't have a parent, it means we don't have access to it.
    const hasParent = !!link?.parentLinkId;
    const isConvertibleDocument = isProtonDocsConvertible(mimeType) && hasParent;

    const showOpenInDocs = isDocsEnabled && (isDocument || isConvertibleDocument);

    const openInDocsAction = (doc: { shareId: string; linkId: string }) => {
        if (isDocument) {
            openDocument(doc);
        } else if (isConvertibleDocument) {
            convertDocument(doc);
        }
    };

    return {
        showOpenInDocs,
        openInDocsAction,
    };
};
