import { c } from 'ttag';

import type { DecryptedLink } from '../../../../store';
import { useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    selectedLinks: DecryptedLink[];
    close: () => void;
}

const MoveToTrashButton = ({ selectedLinks, close }: Props) => {
    const { trashLinks } = useActions(); // We can use it here since we don't need confirmModal

    return (
        <ContextMenuButton
            name={c('Action').t`Move to trash`}
            icon="trash"
            testId="context-menu-trash"
            action={() => trashLinks(new AbortController().signal, selectedLinks)}
            close={close}
        />
    );
};

export default MoveToTrashButton;
