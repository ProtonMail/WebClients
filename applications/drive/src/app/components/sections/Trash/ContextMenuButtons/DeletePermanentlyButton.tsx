import { c } from 'ttag';

import { DecryptedLink, useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    selectedLinks: DecryptedLink[];
    close: () => void;
}

const DeletePermanentlyButton = ({ selectedLinks, close }: Props) => {
    const { deletePermanently } = useActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Delete permanently`}
            icon="cross-circle"
            testId="context-menu-delete"
            action={() => deletePermanently(new AbortController().signal, selectedLinks)}
            close={close}
        />
    );
};

export default DeletePermanentlyButton;
