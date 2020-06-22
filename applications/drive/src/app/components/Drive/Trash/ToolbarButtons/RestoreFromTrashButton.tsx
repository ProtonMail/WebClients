import React from 'react';
import { c } from 'ttag';

import { ToolbarButton, useLoading } from 'react-components';

import { useTrashContent } from '../../Trash/TrashContentProvider';
import useTrash from '../../../../hooks/drive/useTrash';
import useDrive from '../../../../hooks/drive/useDrive';
import useListNotifications from '../../../../hooks/util/useListNotifications';

interface Props {
    shareId: string;
    disabled?: boolean;
    className?: string;
}

const RestoreFromTrashButton = ({ shareId, disabled, className }: Props) => {
    const { events } = useDrive();
    const { restoreLinks } = useTrash();
    const [restoreLoading, withRestoreLoading] = useLoading();
    const { createRestoredLinksNotifications } = useListNotifications();
    const { fileBrowserControls } = useTrashContent();

    const { selectedItems } = fileBrowserControls;

    const restoreFromTrash = async () => {
        if (!selectedItems.length) {
            return;
        }

        const toRestore = selectedItems;
        const result = await restoreLinks(
            shareId,
            selectedItems.map(({ LinkID }) => LinkID)
        );
        createRestoredLinksNotifications(toRestore, result);
        await events.call(shareId);
    };

    return (
        <ToolbarButton
            disabled={disabled || restoreLoading}
            className={className}
            title={c('Action').t`Restore from Trash`}
            icon="repeat"
            onClick={() => withRestoreLoading(restoreFromTrash())}
            data-testid="toolbar-restore"
        />
    );
};

export default RestoreFromTrashButton;
