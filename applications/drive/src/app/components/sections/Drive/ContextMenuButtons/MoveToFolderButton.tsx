import type { useMoveItemsModal } from 'applications/drive/src/app/modals/MoveItemsModal';
import { c } from 'ttag';

import type { DecryptedLink } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
    showMoveItemsModal: ReturnType<typeof useMoveItemsModal>['showMoveItemsModal'];
    close: () => void;
}

const MoveToFolderButton = ({ shareId, selectedLinks, showMoveItemsModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Move to folder`}
            icon="arrows-cross"
            testId="context-menu-move"
            action={() => showMoveItemsModal({ shareId, items: selectedLinks })}
            close={close}
        />
    );
};

export default MoveToFolderButton;
