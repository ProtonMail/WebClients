import { c } from 'ttag';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    items: FileBrowserItem[];
    close: () => void;
}

const RestoreFromTrashButton = ({ shareId, items, close }: Props) => {
    const { restoreLinks } = useActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Restore from trash`}
            icon="arrow-rotate-right"
            testId="context-menu-restore"
            action={() =>
                restoreLinks(
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

export default RestoreFromTrashButton;
