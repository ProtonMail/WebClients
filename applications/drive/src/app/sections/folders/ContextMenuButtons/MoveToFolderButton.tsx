import { c } from 'ttag';

import type { useMoveToFolderModal } from '../../../components/modals/MoveToFolderModal/MoveToFolderModal';
import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import type { MoveItemsModalStateItem } from '../../../modals/MoveItemsModal/useMoveItemsModalState';

interface Props {
    shareId: string;
    selectedItems: MoveItemsModalStateItem[];
    showMoveToFolderModal: ReturnType<typeof useMoveToFolderModal>[1];
    close: () => void;
}

export const MoveToFolderButton = ({ shareId, selectedItems, close, showMoveToFolderModal }: Props) => {
    return (
        <>
            <ContextMenuButton
                name={c('Action').t`Move to folder`}
                icon="arrows-cross"
                testId="context-menu-move"
                action={() => showMoveToFolderModal({ shareId, selectedItems })}
                close={close}
            />
        </>
    );
};
