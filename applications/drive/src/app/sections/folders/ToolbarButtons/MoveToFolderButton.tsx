import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useMoveToFolderModal } from '../../../components/modals/MoveToFolderModal/MoveToFolderModal';
import type { MoveItemsModalStateItem } from '../../../modals/MoveItemsModal/useMoveItemsModalState';

interface Props {
    shareId: string;
    selectedItems: MoveItemsModalStateItem[];
}

export const MoveToFolderButton = ({ shareId, selectedItems }: Props) => {
    const [moveToFolderModal, showMoveToFolderModal] = useMoveToFolderModal();

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Move to folder`}
                icon={<Icon name="arrows-cross" alt={c('Action').t`Move to folder`} />}
                onClick={() => showMoveToFolderModal({ shareId, selectedItems })}
                data-testid="toolbar-move"
            />
            {moveToFolderModal}
        </>
    );
};
