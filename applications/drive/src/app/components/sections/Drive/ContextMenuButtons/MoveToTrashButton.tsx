import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    items: FileBrowserItem[];
    close: () => void;
}

const MoveToTrashButton = ({ shareId, items, close }: Props) => {
    const { trashLinks } = useActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Move to trash`}
            icon="trash"
            testId="context-menu-trash"
            action={() =>
                trashLinks(
                    new AbortController().signal,
                    shareId,
                    items.map((item) => ({
                        parentLinkId: item.ParentLinkID,
                        linkId: item.LinkID,
                        name: item.Name,
                        type: item.Type,
                    }))
                )
            }
            close={close}
        />
    );
};

export default MoveToTrashButton;
