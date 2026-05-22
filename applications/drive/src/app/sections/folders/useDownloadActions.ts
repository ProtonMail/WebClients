import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { DownloadManager } from '../../modules/download/DownloadManager';
import { downloadDocument } from '../../utils/docs/openInDocs';

type Props = {
    selectedItems: {
        mimeType: string;
        uid: string;
    }[];
};

export const useDownloadActions = ({ selectedItems }: Props) => {
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
