import { c } from 'ttag';

import type { DecryptedLink } from '../../../../store';
import type { useMoveToFolderModal } from '../../../modals/MoveToFolderModal/MoveToFolderModal';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
    showMoveToFolderModal: ReturnType<typeof useMoveToFolderModal>[1];
    close: () => void;
}

const MoveToFolderButton = ({ shareId, selectedLinks, showMoveToFolderModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Move to folder`}
            icon="arrows-cross"
            testId="context-menu-move"
            action={() => showMoveToFolderModal({ shareId, selectedItems: selectedLinks })}
            close={close}
        />
    );
};

export default MoveToFolderButton;
