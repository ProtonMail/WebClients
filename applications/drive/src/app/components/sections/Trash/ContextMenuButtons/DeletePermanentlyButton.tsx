import { c } from 'ttag';

import { DecryptedLink, useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
    close: () => void;
}

const DeletePermanentlyButton = ({ shareId, selectedLinks, close }: Props) => {
    const { deletePermanently } = useActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Delete permanently`}
            icon="cross-circle"
            testId="context-menu-delete"
            action={() => deletePermanently(new AbortController().signal, shareId, selectedLinks)}
            close={close}
        />
    );
};

export default DeletePermanentlyButton;
