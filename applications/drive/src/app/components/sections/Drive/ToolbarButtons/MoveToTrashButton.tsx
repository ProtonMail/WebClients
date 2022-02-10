import { c } from 'ttag';

import { Icon, ToolbarButton, useLoading } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useActions } from '../../../../store';
import { DriveFolder } from '../../../../hooks/drive/useActiveShare';

interface Props {
    sourceFolder: DriveFolder;
    selectedItems: FileBrowserItem[];
}

const MoveToTrashButton = ({ sourceFolder, selectedItems }: Props) => {
    const [isLoading, withLoading] = useLoading();
    const { trashLinks } = useActions();

    return (
        <ToolbarButton
            disabled={isLoading}
            title={c('Action').t`Move to trash`}
            icon={<Icon name="trash" />}
            onClick={() =>
                withLoading(
                    trashLinks(
                        new AbortController().signal,
                        sourceFolder.shareId,
                        sourceFolder.linkId,
                        selectedItems.map((item) => ({ linkId: item.LinkID, name: item.Name, type: item.Type }))
                    )
                )
            }
            data-testid="toolbar-trash"
        />
    );
};

export default MoveToTrashButton;
