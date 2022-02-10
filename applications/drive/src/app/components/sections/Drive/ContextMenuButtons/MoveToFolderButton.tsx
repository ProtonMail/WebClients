import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useOpenModal from '../../../useOpenModal';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    items: FileBrowserItem[];
    close: () => void;
}

const MoveToFolderButton = ({ shareId, items, close }: Props) => {
    const { openMoveToFolder } = useOpenModal();

    return (
        <ContextMenuButton
            name={c('Action').t`Move to folder`}
            icon="arrows-up-down-left-right"
            testId="context-menu-move"
            action={() => openMoveToFolder(shareId, items)}
            close={close}
        />
    );
};

export default MoveToFolderButton;
