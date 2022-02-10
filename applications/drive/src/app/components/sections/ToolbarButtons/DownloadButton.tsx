import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useDownload } from '../../../store';
import { noSelection, hasFoldersSelected } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
    disabledFolders?: boolean;
}

const DownloadButton = ({ shareId, selectedItems, disabledFolders }: Props) => {
    const { download } = useDownload();

    const onClick = () => {
        void download(
            selectedItems.map((item) => ({
                type: item.Type,
                shareId,
                linkId: item.LinkID,
                name: item.Name,
                mimeType: item.MIMEType,
                size: item.Size,
            }))
        );
    };

    if (noSelection(selectedItems) || (disabledFolders && hasFoldersSelected(selectedItems))) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Download`}
            icon={<Icon name="arrow-down-to-rectangle" />}
            onClick={onClick}
            data-testid="toolbar-download"
        />
    );
};

export default DownloadButton;
