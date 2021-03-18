import React from 'react';
import { c } from 'ttag';
import { useNotifications, FloatingButton, SidebarPrimaryButton, Icon } from 'react-components';
import useTrash from '../../../hooks/drive/useTrash';
import useConfirm from '../../../hooks/util/useConfirm';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import useDrive from '../../../hooks/drive/useDrive';

interface Props {
    shareId: string;
    floating?: boolean;
    className?: string;
}

const EmptyTrashButton = ({ shareId, floating, className }: Props) => {
    const cache = useDriveCache();
    const { events } = useDrive();
    const { emptyTrash } = useTrash();
    const { openConfirmModal } = useConfirm();
    const { createNotification } = useNotifications();
    const disabled = !cache.get.trashMetas(shareId).length;

    const handleEmptyTrashClick = () => {
        const title = c('Title').t`Empty trash`;
        const confirm = c('Action').t`Empty trash`;
        const message = c('Info').t`Are you sure you want to empty trash and permanently delete all the items?`;

        openConfirmModal({
            title,
            confirm,
            message,
            onConfirm: async () => {
                try {
                    await emptyTrash(shareId);
                    const notificationText = c('Notification').t`All items will soon be permanently deleted from trash`;
                    createNotification({ text: notificationText });
                    await events.callAll(shareId);
                } catch (e) {
                    console.error(e);
                }
            },
        });
    };

    return (
        <>
            {floating ? (
                <FloatingButton
                    disabled={disabled}
                    color="danger"
                    onClick={handleEmptyTrashClick}
                    title={c('Action').t`Empty trash`}
                >
                    <Icon size={24} name="empty-folder" className="mauto" />
                </FloatingButton>
            ) : (
                <SidebarPrimaryButton
                    color="danger"
                    className={className}
                    disabled={disabled}
                    onClick={handleEmptyTrashClick}
                >{c('Action').t`Empty trash`}</SidebarPrimaryButton>
            )}
        </>
    );
};

export default EmptyTrashButton;
