import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useOpenModal from '../../../useOpenModal';
import { ContextMenuButton } from '../../ContextMenu';
import { DriveFolder } from '../../../../hooks/drive/useActiveShare';

interface Props {
    sourceFolder: DriveFolder;
    items: FileBrowserItem[];
    close: () => void;
}

const MoveToFolderButton = ({ sourceFolder, items, close }: Props) => {
    const { openMoveToFolder } = useOpenModal();

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
