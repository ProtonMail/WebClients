import { c } from 'ttag';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { useActions } from '../../../store';

type Item = {
    parentLinkId: string;
    linkId: string;
    rootShareId: string;
    volumeId: string;
    isFile: boolean;
};

interface Props {
    selectedItems: Item[];
    close: () => void;
}

export const MoveToTrashButton = ({ selectedItems, close }: Props) => {
    const { trashLinks } = useActions(); // We can use it here since we don't need confirmModal

    return (
        <ContextMenuButton
            name={c('Action').t`Move to trash`}
            icon="trash"
            testId="context-menu-trash"
            action={() => trashLinks(new AbortController().signal, selectedItems)}
            close={close}
        />
    );
};
