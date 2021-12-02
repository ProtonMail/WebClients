import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useToolbarActions from '../../../hooks/drive/useActions';
import { noSelection, hasFoldersSelected } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
    disabledFolders?: boolean;
}

const DownloadButton = ({ shareId, selectedItems, disabledFolders }: Props) => {
    const { download } = useToolbarActions();

    if (noSelection(selectedItems) || (disabledFolders && hasFoldersSelected(selectedItems))) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Download`}
            icon={<Icon name="arrow-down-to-rectangle" />}
            onClick={() => download(shareId, selectedItems)}
            data-testid="toolbar-download"
        />
    );
};

export default DownloadButton;
