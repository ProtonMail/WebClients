import { c } from 'ttag';

import { useMoveToFolderModal } from '../../../components/modals/MoveToFolderModal/MoveToFolderModal';
import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import type { MoveItemsModalStateItem } from '../../../modals/MoveItemsModal/useMoveItemsModalState';

interface Props {
    shareId: string;
    selectedItems: MoveItemsModalStateItem[];
    close: () => void;
}

export const MoveToFolderButton = ({ shareId, selectedItems, close }: Props) => {
    const [moveToFolderModal, showMoveToFolderModal] = useMoveToFolderModal();

    return (
        <>
            <ContextMenuButton
                name={c('Action').t`Move to folder`}
                icon="arrows-cross"
                testId="context-menu-move"
                action={() => showMoveToFolderModal({ shareId, selectedItems })}
                close={close}
            />
            {moveToFolderModal}
        </>
    );
};
