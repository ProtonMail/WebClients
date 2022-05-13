import { c } from 'ttag';

import { DecryptedLink, useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
    close: () => void;
}

const MoveToTrashButton = ({ shareId, selectedLinks, close }: Props) => {
    const { trashLinks } = useActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Move to trash`}
            icon="trash"
            testId="context-menu-trash"
            action={() => trashLinks(new AbortController().signal, shareId, selectedLinks)}
            close={close}
        />
    );
};

export default MoveToTrashButton;
