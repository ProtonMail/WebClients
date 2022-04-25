import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import useOpenModal from '../../../useOpenModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    item: FileBrowserItem;
    close: () => void;
}

const RenameButton = ({ shareId, item, close }: Props) => {
    const { openRename } = useOpenModal();

    return (
        <ContextMenuButton
            name={c('Action').t`Rename`}
            icon="pen-square"
            testId="context-menu-rename"
            action={() => openRename(shareId, item)}
            close={close}
        />
    );
};

export default RenameButton;
