import { useRemoveDeviceModal } from '../../../modals/RemoveDeviceModal';
import { useRenameDeviceModal } from '../../../modals/RenameDeviceModal';

export const useDevicesActions = () => {
    const { renameDeviceModal, showRenameDeviceModal } = useRenameDeviceModal();
    const { removeDeviceModal, showRemoveDeviceModal } = useRemoveDeviceModal();

    const handleRename = (deviceUid: string) => {
        showRenameDeviceModal({ deviceUid });
    };

    const handleRemove = (deviceUid: string) => {
        showRemoveDeviceModal({ deviceUid });
    };

    return {
        modals: {
            renameDeviceModal,
            removeDeviceModal,
        },
        handleRename,
        handleRemove,
    };
};
