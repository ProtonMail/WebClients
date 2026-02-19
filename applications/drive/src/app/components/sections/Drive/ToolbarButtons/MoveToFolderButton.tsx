import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcArrowsCross } from '@proton/icons/icons/IcArrowsCross';

import { useMoveItemsModal } from '../../../../modals/MoveItemsModal';
import type { DecryptedLink } from '../../../../store';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const MoveToFolderButton = ({ shareId, selectedLinks }: Props) => {
    const { moveItemsModal, showMoveItemsModal } = useMoveItemsModal();

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Move to folder`}
                icon={<IcArrowsCross alt={c('Action').t`Move to folder`} />}
                onClick={() => showMoveItemsModal({ shareId, items: selectedLinks })}
                data-testid="toolbar-move"
            />
            {moveItemsModal}
        </>
    );
};

export default MoveToFolderButton;
