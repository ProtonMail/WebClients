import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { FileBrowserItem } from '../interfaces';
import { noSelection, hasFoldersSelected } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
    disabledFolders?: boolean;
}

const DownloadButton = ({ shareId, selectedItems, disabledFolders }: Props) => {
    const { download } = useToolbarActions();

    return (
        <ToolbarButton
            disabled={noSelection(selectedItems) || (disabledFolders && hasFoldersSelected(selectedItems))}
            title={c('Action').t`Download`}
            icon={<Icon name="arrow-down-to-rectangle" />}
            onClick={() => download(shareId, selectedItems)}
            data-testid="toolbar-download"
        />
    );
};

export default DownloadButton;
