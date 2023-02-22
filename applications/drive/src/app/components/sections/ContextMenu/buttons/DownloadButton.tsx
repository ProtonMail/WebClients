import { c } from 'ttag';

import { DecryptedLink, useDownload } from '../../../../store';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    selectedLinks: DecryptedLink[];
    close: () => void;
}

const DownloadButton = ({ selectedLinks, close }: Props) => {
    const { download } = useDownload();

    const onClick = () => {
        void download(
            selectedLinks.map((link) => ({
                ...link,
                shareId: link.rootShareId,
            }))
        );
    };

    return (
        <ContextMenuButton
            name={c('Action').t`Download`}
            icon="arrow-down-line"
            testId="context-menu-download"
            action={onClick}
            close={close}
        />
    );
};

export default DownloadButton;
