import React from 'react';
import { c } from 'ttag';

import { ToolbarButton, useNotifications, useEventManager } from 'react-components';

import useDrive from '../../../../hooks/drive/useDrive';
import useTrash from '../../../../hooks/drive/useTrash';
import useConfirm from '../../../../hooks/util/useConfirm';

interface Props {
    shareId: string;
    disabled?: boolean;
}

const EmptyTrashButton = ({ shareId, disabled }: Props) => {
    const { call } = useEventManager();
    const { events } = useDrive();
    const { emptyTrash } = useTrash();
    const { openConfirmModal } = useConfirm();
    const { createNotification } = useNotifications();

    const handleEmptyTrashClick = () => {
        const title = c('Title').t`Empty Trash`;
        const confirm = c('Action').t`Empty Trash`;
        const message = c('Info').t`empty Trash and permanently delete all the items`;

        openConfirmModal(title, confirm, message, async () => {
            await emptyTrash(shareId);

            const notificationText = c('Notification').t`All the items are permanently deleted from Trash`;
            createNotification({ text: notificationText });
            call();
            events.call(shareId);
        });
    };

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Empty Trash`}
            onClick={handleEmptyTrashClick}
            icon="delete"
            data-testid="toolbar-empty-trash"
        />
    );
};

export default EmptyTrashButton;
