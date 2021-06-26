import React from 'react';
import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useTrashContent } from '../TrashContentProvider';
import useToolbarActions from '../../../../hooks/drive/useToolbarActions';

interface Props {
    shareId: string;
    disabled?: boolean;
}

const DeletePermanentlyButton = ({ shareId, disabled }: Props) => {
    const { openDeletePermanently } = useToolbarActions();
    const { fileBrowserControls } = useTrashContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Delete permanently`}
            icon={<Icon name="delete" />}
            onClick={() => openDeletePermanently(shareId, selectedItems)}
            data-testid="toolbar-delete"
        />
    );
};

export default DeletePermanentlyButton;
