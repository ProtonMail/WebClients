import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useOpenModal from '../../../useOpenModal';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const MoveToFolderButton = ({ shareId, selectedItems }: Props) => {
    const { openMoveToFolder } = useOpenModal();

    return (
        <ToolbarButton
            title={c('Action').t`Move to folder`}
            icon={<Icon name="arrows-cross" />}
            onClick={() => openMoveToFolder(shareId, selectedItems)}
            data-testid="toolbar-move"
        />
    );
};

export default MoveToFolderButton;
