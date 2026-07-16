import { c } from 'ttag';

import { IcTrash } from '@proton/icons/icons/IcTrash';

import type { DecryptedLink } from '../../../../../legacy/store';
import { useActions } from '../../../../../legacy/store';
import { ContextMenuButton } from '../../../../../statelessComponents/ContextMenu';

interface Props {
    selectedLinks: DecryptedLink[];
    close: () => void;
}

const MoveToTrashButton = ({ selectedLinks, close }: Props) => {
    const { trashLinks } = useActions(); // We can use it here since we don't need confirmModal
    const title = c('Action').t`Move to trash`;

    return (
        <ContextMenuButton
            name={title}
            icon={<IcTrash />}
            testId="context-menu-trash"
            action={() => trashLinks(new AbortController().signal, selectedLinks)}
            close={close}
        />
    );
};

export default MoveToTrashButton;
