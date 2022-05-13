import { c } from 'ttag';

import { DecryptedLink } from '../../../../store';
import useOpenModal from '../../../useOpenModal';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
    close: () => void;
}

const MoveToFolderButton = ({ shareId, selectedLinks, close }: Props) => {
    const { openMoveToFolder } = useOpenModal();

    return (
        <ContextMenuButton
            name={c('Action').t`Move to folder`}
            icon="arrows-cross"
            testId="context-menu-move"
            action={() => openMoveToFolder(shareId, selectedLinks)}
            close={close}
        />
    );
};

export default MoveToFolderButton;
