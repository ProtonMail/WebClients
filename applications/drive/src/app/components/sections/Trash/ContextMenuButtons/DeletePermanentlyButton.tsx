import { c } from 'ttag';

import useToolbarActions from '../../../../hooks/drive/useActions';
import { FileBrowserItem } from '../../../FileBrowser';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    items: FileBrowserItem[];
    close: () => void;
}

const DeletePermanentlyButton = ({ shareId, items, close }: Props) => {
    const { openDeletePermanently } = useToolbarActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Delete permanently`}
            icon="circle-xmark"
            testId="context-menu-delete"
            action={() => openDeletePermanently(shareId, items)}
            close={close}
        />
    );
};

export default DeletePermanentlyButton;
