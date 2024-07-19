import { c } from 'ttag';

import type { DecryptedLink, useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    selectedLinks: DecryptedLink[];
    deletePermanently: ReturnType<typeof useActions>['deletePermanently'];
    close: () => void;
}

const DeletePermanentlyButton = ({ selectedLinks, deletePermanently, close }: Props) => {
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
