import { c } from 'ttag';

import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import usePublicToken from '../../../../hooks/drive/usePublicToken';
import type { LinkDownload } from '../../../../store';
import { useDownload } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface SelectedBrowserItem extends Omit<LinkDownload, 'shareId'> {
    rootShareId: string;
    mimeType: string;
}
interface Props {
    selectedBrowserItems: SelectedBrowserItem[];
    close: () => void;
    openInDocs?: (linkId: string, options?: { redirect?: boolean; download?: boolean }) => void;
    virusScan?: boolean;
}
export const DownloadButton = ({ selectedBrowserItems, close, openInDocs, virusScan }: Props) => {
    const { download } = useDownload();
    const { token } = usePublicToken();
    const count = selectedBrowserItems.length;
    const isDoc = isProtonDocsDocument(selectedBrowserItems[0]?.mimeType);

    const onClick = async () => {
        // Document downloads are handled in two ways:
        //  1. single files are redirected to the Docs app using `downloadDocument`
        //  2. multiple files are ignored, using `handleContainsDocument` in the queue
        const documentLink = selectedBrowserItems.length === 1 && isDoc ? selectedBrowserItems[0] : undefined;

        if (documentLink) {
            // Should never happen to have openInDocs false as the button will be hidden in that case
            if (openInDocs) {
                void openInDocs(documentLink.linkId, { download: true });
            }
            return;
        }

        void download(
            selectedBrowserItems.map((link) => ({
                ...link,
                shareId: token,
            })),
            { virusScan }
        );
    };

    const buttonTextWithScan = count > 1 ? c('Action').t`Scan & Download (${count})` : c('Action').t`Scan & Download`;
    const buttonTextWithoutScan = count > 1 ? c('Action').t`Download (${count})` : c('Action').t`Download`;

    return (
        <ContextMenuButton
            name={virusScan || isDoc ? buttonTextWithScan : buttonTextWithoutScan}
            icon="arrow-down-line"
            testId={`context-menu-download${virusScan ? '-scan' : ''}`}
            action={onClick}
            close={close}
        />
    );
};
