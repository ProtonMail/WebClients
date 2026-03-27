import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { useDocumentActions } from '../../hooks/docs/useDocumentActions';
import { DownloadManager } from '../../managers/download/DownloadManager';

type Props = {
    selectedItems: {
        mimeType: string;
        uid: string;
    }[];
};

export const useDownloadActions = ({ selectedItems }: Props) => {
    const { downloadDocument } = useDocumentActions();
    const dm = DownloadManager.getInstance();

    const downloadItems = async () => {
        if (selectedItems.length === 1) {
            const item = selectedItems[0];
            if (item.mimeType && isProtonDocsDocument(item.mimeType)) {
                await downloadDocument({
                    type: 'doc',
                    uid: item.uid,
                });
                return;
            } else if (item.mimeType && isProtonDocsSpreadsheet(item.mimeType)) {
                await downloadDocument({
                    type: 'sheet',
                    uid: item.uid,
                });
                return;
            }
        }

        await dm.download(selectedItems.map((item) => item.uid));
    };

    return {
        downloadItems,
    };
};
