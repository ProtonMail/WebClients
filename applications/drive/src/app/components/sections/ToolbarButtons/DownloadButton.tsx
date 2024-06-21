import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import { DecryptedLink, useDownload } from '../../../store';
import { useDocumentActions } from '../../../store/_documents';
import { hasFoldersSelected, noSelection } from './utils';

interface Props {
    selectedLinks: DecryptedLink[];
    disabledFolders?: boolean;
}

const DownloadButton = ({ selectedLinks, disabledFolders }: Props) => {
    const { download } = useDownload();
    const { downloadDocument } = useDocumentActions();

    const onClick = () => {
        // Document downloads are handled in two ways:
        //  1. single files are redirected to the Docs app using `downloadDocument`
        //  2. multiple files are ignored, using `handleContainsDocument` in the queue
        const documentLink =
            selectedLinks.length === 1 && isProtonDocument(selectedLinks[0].mimeType) ? selectedLinks[0] : undefined;

        if (documentLink) {
            downloadDocument({
                shareId: documentLink.rootShareId,
                linkId: documentLink.linkId,
            });
            return;
        }

        void download(
            selectedLinks.map((link) => ({
                ...link,
                shareId: link.rootShareId,
            }))
        );
    };

    if (noSelection(selectedLinks) || (disabledFolders && hasFoldersSelected(selectedLinks))) {
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
