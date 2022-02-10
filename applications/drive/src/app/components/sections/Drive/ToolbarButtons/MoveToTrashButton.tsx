import { c } from 'ttag';

import { Icon, ToolbarButton, useLoading } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useActions } from '../../../../store';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const MoveToTrashButton = ({ shareId, selectedItems }: Props) => {
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
                        shareId,
                        selectedItems.map((item) => ({
                            parentLinkId: item.ParentLinkID,
                            linkId: item.LinkID,
                            name: item.Name,
                            type: item.Type,
                        }))
                    )
                )
            }
            data-testid="toolbar-trash"
        />
    );
};

export default MoveToTrashButton;
