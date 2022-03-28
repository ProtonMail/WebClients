import { c } from 'ttag';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive//fileBrowser';

import { useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    items: FileBrowserItem[];
    close: () => void;
}

const DeletePermanentlyButton = ({ shareId, items, close }: Props) => {
    const { deletePermanently } = useActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Delete permanently`}
            icon="circle-xmark"
            testId="context-menu-delete"
            action={() =>
                deletePermanently(
                    new AbortController().signal,
                    shareId,
                    items.map((item) => ({
                        parentLinkId: item.ParentLinkID,
                        linkId: item.LinkID,
                        name: item.Name,
                        isFile: item.IsFile,
                    }))
                )
            }
            close={close}
        />
    );
};

export default DeletePermanentlyButton;
