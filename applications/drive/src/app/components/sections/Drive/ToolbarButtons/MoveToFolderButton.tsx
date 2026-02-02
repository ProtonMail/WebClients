import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcArrowsCross } from '@proton/icons/icons/IcArrowsCross';

import type { DecryptedLink } from '../../../../store';
import { useMoveToFolderModal } from '../../../modals/MoveToFolderModal/MoveToFolderModal';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const MoveToFolderButton = ({ shareId, selectedLinks }: Props) => {
    const [moveToFolderModal, showMoveToFolderModal] = useMoveToFolderModal();

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Move to folder`}
                icon={<IcArrowsCross alt={c('Action').t`Move to folder`} />}
                onClick={() => showMoveToFolderModal({ shareId, selectedItems: selectedLinks })}
                data-testid="toolbar-move"
            />
            {moveToFolderModal}
        </>
    );
};

export default MoveToFolderButton;
