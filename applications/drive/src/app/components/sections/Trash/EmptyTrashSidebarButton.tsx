import { c } from 'ttag';

import { useNotifications, FloatingButton, SidebarPrimaryButton, Icon } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import useTrash from '../../../hooks/drive/useTrash';
import useConfirm from '../../../hooks/util/useConfirm';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import useDrive from '../../../hooks/drive/useDrive';

interface Props {
    mobileVersion?: boolean;
}

const EmptyTrashSidebarButton = ({ mobileVersion = false }: Props) => {
    const cache = useDriveCache();
    const { activeShareId } = useActiveShare();
    const { events } = useDrive();
    const { emptyTrash } = useTrash();
    const { openConfirmModal } = useConfirm();
    const { createNotification } = useNotifications();
    const disabled = !cache.get.trashMetas(activeShareId).length;

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
                    await emptyTrash(activeShareId);
                    const notificationText = c('Notification').t`All items will soon be permanently deleted from trash`;
                    createNotification({ text: notificationText });
                    await events.callAll(activeShareId);
                } catch (e) {
                    console.error(e);
                }
            },
        });
    };

    return mobileVersion ? (
        <FloatingButton
            disabled={disabled}
            color="danger"
            onClick={handleEmptyTrashClick}
            title={c('Action').t`Empty trash`}
        >
            <Icon size={24} name="broom" className="mauto" />
        </FloatingButton>
    ) : (
        <SidebarPrimaryButton color="danger" className="no-mobile" disabled={disabled} onClick={handleEmptyTrashClick}>
            {c('Action').t`Empty trash`}
        </SidebarPrimaryButton>
    );
};

export default EmptyTrashSidebarButton;
