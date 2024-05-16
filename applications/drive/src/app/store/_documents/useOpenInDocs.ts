import { isProtonDocsConvertible, isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import { useDocumentActions } from './useDocumentActions';
import { useDriveDocsFeatureFlag } from './useDriveDocsFeatureFlag';

export const useOpenInDocs = (mimeType: string = '') => {
    const { openDocument, convertDocument } = useDocumentActions();
    const isDocsEnabled = useDriveDocsFeatureFlag();

    const isDocument = isProtonDocument(mimeType);
    const isConvertibleDocument = isProtonDocsConvertible(mimeType);

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
