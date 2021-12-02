import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useTrashContent } from '../TrashContentProvider';
import useToolbarActions from '../../../../hooks/drive/useActions';

interface Props {
    shareId: string;
}

const DeletePermanentlyButton = ({ shareId }: Props) => {
    const { openDeletePermanently } = useToolbarActions();
    const { fileBrowserControls } = useTrashContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <ToolbarButton
            title={c('Action').t`Delete permanently`}
            icon={<Icon name="circle-xmark" />}
            onClick={() => openDeletePermanently(shareId, selectedItems)}
            data-testid="toolbar-delete"
        />
    );
};

export default DeletePermanentlyButton;
