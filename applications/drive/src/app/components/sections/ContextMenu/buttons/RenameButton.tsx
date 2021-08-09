import { c } from 'ttag';

import useToolbarActions from '../../../../hooks/drive/useActions';
import { FileBrowserItem } from '../../../FileBrowser';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    item: FileBrowserItem;
    close: () => void;
}

const RenameButton = ({ shareId, item, close }: Props) => {
    const { openRename } = useToolbarActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Rename`}
            icon="note-pen"
            testId="context-menu-rename"
            action={() => openRename(shareId, item)}
            close={close}
        />
    );
};

export default RenameButton;
