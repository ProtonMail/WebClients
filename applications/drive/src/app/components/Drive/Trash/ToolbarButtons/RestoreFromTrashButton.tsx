import React from 'react';
import { c } from 'ttag';

import { ToolbarButton, useLoading } from 'react-components';

import { useTrashContent } from '../TrashContentProvider';
import useToolbarActions from '../../../../hooks/drive/useToolbarActions';

interface Props {
    shareId: string;
    disabled?: boolean;
}

const RestoreFromTrashButton = ({ shareId, disabled }: Props) => {
    const [restoreLoading, withRestoreLoading] = useLoading();
    const { restoreFromTrash } = useToolbarActions();
    const { fileBrowserControls } = useTrashContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <ToolbarButton
            disabled={disabled || restoreLoading}
            title={c('Action').t`Restore from Trash`}
            icon="repeat"
            onClick={() => withRestoreLoading(restoreFromTrash(shareId, selectedItems))}
            data-testid="toolbar-restore"
        />
    );
};

export default RestoreFromTrashButton;
