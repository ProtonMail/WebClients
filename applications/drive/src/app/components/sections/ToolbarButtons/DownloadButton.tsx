import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink, useDownload } from '../../../store';
import { hasFoldersSelected, noSelection } from './utils';

interface Props {
    selectedLinks: DecryptedLink[];
    disabledFolders?: boolean;
}

const DownloadButton = ({ selectedLinks, disabledFolders }: Props) => {
    const { download } = useDownload();

    const onClick = () => {
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
