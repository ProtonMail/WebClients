import { c } from 'ttag';

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
    virusScan?: boolean;
}
export const DownloadButton = ({ selectedBrowserItems, close, virusScan }: Props) => {
    const { download } = useDownload();
    const { token } = usePublicToken();
    const count = selectedBrowserItems.length;

    const onClick = async () => {
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
            name={virusScan ? buttonTextWithScan : buttonTextWithoutScan}
            icon="arrow-down-line"
            testId={`context-menu-download${virusScan ? '-scan' : ''}`}
            action={onClick}
            close={close}
        />
    );
};

// Document downloads are handled in two ways:
//  1. single files are redirected to the Docs app using `downloadDocument`
//  2. multiple files are ignored, using `handleContainsDocument` in the queue
export function DownloadDocumentButton({
    documentLink,
    close,
    openInDocs,
}: {
    documentLink: SelectedBrowserItem;
    close: () => void;
    openInDocs: (linkId: string, options?: { redirect?: boolean; download?: boolean; mimeType?: string }) => void;
}) {
    const onClick = async () => {
        void openInDocs(documentLink.linkId, { download: true, mimeType: documentLink.mimeType });
    };

    return (
        <ContextMenuButton
            name={c('Action').t`Download`}
            icon="arrow-down-line"
            testId="context-menu-download-document"
            action={onClick}
            close={close}
        />
    );
}
