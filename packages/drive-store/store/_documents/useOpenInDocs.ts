import { isProtonDocsConvertible, isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import type { DecryptedLink } from '../_links';
import { useDocumentActions } from './useDocumentActions';
import { useDriveDocsFeatureFlag } from './useDriveDocsFeatureFlag';

export const useOpenInDocs = (link: Pick<DecryptedLink, 'mimeType' | 'parentLinkId'> | undefined) => {
    const { openDocument, convertDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();

    const mimeType = link?.mimeType || '';

    const isDocument = isProtonDocument(mimeType);

    // Docs tries to convert by creating a node in the parent folder.
    // If the link doesn't have a parent, it means we don't have access to it.
    const hasParent = !!link?.parentLinkId;
    const isConvertibleDocument = isProtonDocsConvertible(mimeType) && hasParent;

    const showOpenInDocs = isDocsEnabled && (isDocument || isConvertibleDocument);

    const openInDocsAction = async (
        doc: { shareId: string; linkId: string },
        openBehavior: 'tab' | 'redirect' = 'tab'
    ) => {
        if (isDocument) {
            await openDocument({ ...doc, openBehavior });
        } else if (isConvertibleDocument) {
            await convertDocument(doc);
        }
    };

    return {
        showOpenInDocs,
        openInDocsAction,
    };
};
