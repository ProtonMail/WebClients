import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import type { LinkDownload } from '../../../store';
import { useDownload } from '../../../store';
import { useDocumentActions } from '../../../store/_documents';
import { hasFoldersSelected, noSelection } from './utils';

interface SelectedBrowserItem extends Omit<LinkDownload, 'shareId'> {
    rootShareId: string;
    mimeType: string;
}
interface Props {
    selectedBrowserItems: SelectedBrowserItem[];
    disabledFolders?: boolean;
}

const DownloadButton = ({ selectedBrowserItems, disabledFolders }: Props) => {
    const { download } = useDownload();
    const { downloadDocument } = useDocumentActions();

    const onClick = () => {
        // Document downloads are handled in two ways:
        //  1. single files are redirected to the Docs app using `downloadDocument`
        //  2. multiple files are ignored, using `handleContainsDocument` in the queue
        if (selectedBrowserItems.length === 1) {
            const item = selectedBrowserItems[0];
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
            selectedBrowserItems.map((link) => ({
                ...link,
                shareId: link.rootShareId,
            }))
        );
    };

    if (noSelection(selectedBrowserItems) || (disabledFolders && hasFoldersSelected(selectedBrowserItems))) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Download`}
            icon={<Icon name="arrow-down-line" alt={c('Action').t`Download`} />}
            onClick={onClick}
            data-testid="toolbar-download"
        />
    );
};

export default DownloadButton;
