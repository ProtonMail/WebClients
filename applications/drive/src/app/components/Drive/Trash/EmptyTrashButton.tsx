import React from 'react';
import { c } from 'ttag';
import { useNotifications, FloatingButton, SidebarPrimaryButton } from 'react-components';
import useDrive from '../../../hooks/drive/useDrive';
import useTrash from '../../../hooks/drive/useTrash';
import useConfirm from '../../../hooks/util/useConfirm';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';

interface Props {
    shareId: string;
    floating?: boolean;
}

const EmptyTrashButton = ({ shareId, floating }: Props) => {
    const cache = useDriveCache();
    const { events } = useDrive();
    const { emptyTrash } = useTrash();
    const { openConfirmModal } = useConfirm();
    const { createNotification } = useNotifications();
    const disabled = !cache.get.trashMetas(shareId).length;

    const handleEmptyTrashClick = () => {
        const title = c('Title').t`Empty Trash`;
        const confirm = c('Action').t`Empty Trash`;
        const message = c('Info').t`empty Trash and permanently delete all the items`;

        openConfirmModal(title, confirm, message, async () => {
            try {
                await emptyTrash(shareId);
                const notificationText = c('Notification').t`All items will soon be permanently deleted from Trash`;
                createNotification({ text: notificationText });
                await events.callAll(shareId);
            } catch (e) {
                console.error(e);
            }
        });
    };

    return (
        <>
            {floating ? (
                <FloatingButton
                    disabled={disabled}
                    className="pm-button--error"
                    onClick={handleEmptyTrashClick}
                    title={c('Action').t`Empty Trash`}
                    icon="empty-folder"
                />
            ) : (
                <SidebarPrimaryButton
                    className="pm-button--error"
                    disabled={disabled}
                    onClick={handleEmptyTrashClick}
                >{c('Action').t`Empty Trash`}</SidebarPrimaryButton>
            )}
        </>
    );
};

export default EmptyTrashButton;
