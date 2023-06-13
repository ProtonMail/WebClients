import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink } from '../../../../store';
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
                icon={<Icon name="arrows-cross" alt={c('Action').t`Move to folder`} />}
                onClick={() => showMoveToFolderModal({ shareId, selectedItems: selectedLinks })}
                data-testid="toolbar-move"
            />
            {moveToFolderModal}
        </>
    );
};

export default MoveToFolderButton;
