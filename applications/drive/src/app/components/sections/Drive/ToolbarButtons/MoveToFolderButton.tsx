import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink } from '../../../../store';
import useOpenModal from '../../../useOpenModal';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const MoveToFolderButton = ({ shareId, selectedLinks }: Props) => {
    const { openMoveToFolder } = useOpenModal();

    return (
        <ToolbarButton
            title={c('Action').t`Move to folder`}
            icon={<Icon name="arrows-cross" />}
            onClick={() => openMoveToFolder(shareId, selectedLinks)}
            data-testid="toolbar-move"
        />
    );
};

export default MoveToFolderButton;
