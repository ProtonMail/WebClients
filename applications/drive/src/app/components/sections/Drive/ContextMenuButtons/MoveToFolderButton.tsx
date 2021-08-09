import { c } from 'ttag';

import useToolbarActions from '../../../../hooks/drive/useActions';
import { FileBrowserItem } from '../../../FileBrowser';
import { ContextMenuButton } from '../../ContextMenu';
import { DriveFolder } from '../DriveFolderProvider';

interface Props {
    sourceFolder: DriveFolder;
    items: FileBrowserItem[];
    close: () => void;
}

const MoveToFolderButton = ({ sourceFolder, items, close }: Props) => {
    const { openMoveToFolder } = useToolbarActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Move to folder`}
            icon="arrows-up-down-left-right"
            testId="context-menu-move"
            action={() => openMoveToFolder(sourceFolder, items)}
            close={close}
        />
    );
};

export default MoveToFolderButton;
