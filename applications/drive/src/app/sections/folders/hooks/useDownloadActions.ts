import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { useDownload } from '../../../store';
import { useDocumentActions } from '../../../store/_documents';
import type { LegacyItem } from '../../../utils/sdk/mapNodeToLegacyItem';

type Props = {
    selectedItems: LegacyItem[];
};

export const useDownloadActions = ({ selectedItems }: Props) => {
    const { download } = useDownload();
    const { downloadDocument } = useDocumentActions();

    const downloadItems = () => {
        // Document downloads are handled in two ways:
        //  1. single files are redirected to the Docs app using `downloadDocument`
        //  2. multiple files are ignored, using `handleContainsDocument` in the queue
        if (selectedItems.length === 1) {
            const item = selectedItems[0];
            if (isProtonDocsDocument(item.mimeType)) {
                void downloadDocument({
                    type: 'doc',
                    shareId: item.rootShareId,
                    linkId: item.linkId,
                });
                return;
            } else if (isProtonDocsSpreadsheet(item.mimeType)) {
                void downloadDocument({
                    type: 'sheet',
                    shareId: item.rootShareId,
                    linkId: item.linkId,
                });
                return;
            }
        }

        void download(
            selectedItems.map((link) => ({
                ...link,
                shareId: link.rootShareId,
            }))
        );
    };

    return {
        downloadItems,
    };
};
