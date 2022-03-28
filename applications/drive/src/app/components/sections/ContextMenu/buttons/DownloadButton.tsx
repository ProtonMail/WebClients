import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useDownload } from '../../../../store';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    items: FileBrowserItem[];
    close: () => void;
}

const DownloadButton = ({ shareId, items, close }: Props) => {
    const { download } = useDownload();

    const onClick = () => {
        void download(
            items.map((item) => ({
                isFile: item.IsFile,
                shareId,
                linkId: item.LinkID,
                name: item.Name,
                mimeType: item.MIMEType,
                size: item.Size,
                signatureAddress: item.SignatureAddress,
                signatureIssues: item.SignatureIssues,
            }))
        );
    };

    return (
        <ContextMenuButton
            name={c('Action').t`Download`}
            icon="arrow-down-to-rectangle"
            testId="context-menu-download"
            action={onClick}
            close={close}
        />
    );
};

export default DownloadButton;
