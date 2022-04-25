import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useActions } from '../../../../store';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const DeletePermanentlyButton = ({ shareId, selectedItems }: Props) => {
    const { deletePermanently } = useActions();

    return (
        <ToolbarButton
            title={c('Action').t`Delete permanently`}
            icon={<Icon name="cross-circle" />}
            onClick={() =>
                deletePermanently(
                    new AbortController().signal,
                    shareId,
                    selectedItems.map((item) => ({
                        parentLinkId: item.ParentLinkID,
                        linkId: item.LinkID,
                        name: item.Name,
                        isFile: item.IsFile,
                    }))
                )
            }
            data-testid="toolbar-delete"
        />
    );
};

export default DeletePermanentlyButton;
