import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';
import { DriveFolder } from '../../../../hooks/drive/useActiveShare';

interface Props {
    sourceFolder: DriveFolder;
    items: FileBrowserItem[];
    close: () => void;
}

const MoveToTrashButton = ({ sourceFolder, items, close }: Props) => {
    const { trashLinks } = useActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Move to trash`}
            icon="trash"
            testId="context-menu-trash"
            action={() =>
                trashLinks(
                    new AbortController().signal,
                    sourceFolder.shareId,
                    sourceFolder.linkId,
                    items.map((item) => ({ linkId: item.LinkID, name: item.Name, type: item.Type }))
                )
            }
            close={close}
        />
    );
};

export default MoveToTrashButton;
