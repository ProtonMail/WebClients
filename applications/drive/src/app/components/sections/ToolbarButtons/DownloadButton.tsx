import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink, useDownload } from '../../../store';
import { noSelection, hasFoldersSelected } from './utils';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
    disabledFolders?: boolean;
}

const DownloadButton = ({ shareId, selectedLinks, disabledFolders }: Props) => {
    const { download } = useDownload();

    const onClick = () => {
        void download(
            selectedLinks.map((link) => ({
                ...link,
                shareId,
            }))
        );
    };

    if (noSelection(selectedLinks) || (disabledFolders && hasFoldersSelected(selectedLinks))) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Download`}
            icon={<Icon name="arrow-down-line" />}
            onClick={onClick}
            data-testid="toolbar-download"
        />
    );
};

export default DownloadButton;
