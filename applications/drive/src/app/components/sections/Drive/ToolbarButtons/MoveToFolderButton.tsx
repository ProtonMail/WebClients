import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useToolbarActions from '../../../../hooks/drive/useActions';
import { DriveFolder } from '../../../../hooks/drive/useActiveShare';

interface Props {
    sourceFolder: DriveFolder;
    selectedItems: FileBrowserItem[];
}

const MoveToFolderButton = ({ sourceFolder, selectedItems }: Props) => {
    const { openMoveToFolder } = useToolbarActions();

    return (
        <ToolbarButton
            title={c('Action').t`Move to folder`}
            icon={<Icon name="arrows-up-down-left-right" />}
            onClick={() => openMoveToFolder(sourceFolder, selectedItems)}
            data-testid="toolbar-move"
        />
    );
};

export default MoveToFolderButton;
