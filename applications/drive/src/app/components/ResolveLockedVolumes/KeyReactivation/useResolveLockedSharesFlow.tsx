import { useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';

import { useLockedVolume } from '../../../store';
import { useDeleteLockedVolumesConfirmModal } from './DeleteLockedVolumesConfirmModal';
import { useKeyReactivationModal } from './KeyReactivationModal';
import { useUnlockDriveConfirmationDialog } from './UnlockDriveConfirmationDialog';
import { LockedVolumeResolveMethod } from './interfaces';

interface ReactivationParams {
    onSuccess?: () => void;
    onError?: () => void;
}

const useResolveLockedSharesFlow = ({ onSuccess, onError }: ReactivationParams) => {
    const lastResolveMethod = useRef<LockedVolumeResolveMethod>(LockedVolumeResolveMethod.ReactivateKeys);

    const { lockedVolumesCount, deleteLockedVolumes } = useLockedVolume();
    const [keyReactivationModal, showKeyReactivationModal] = useKeyReactivationModal();
    const [deleteLockedVolumesConfirmModal, showDeleteLockedVolumesConfirmModal] = useDeleteLockedVolumesConfirmModal();
    const [unlockDriveConfirmationDialog, showUnlockDriveConfirmationDialog] = useUnlockDriveConfirmationDialog();
    const { createNotification } = useNotifications();

    const handleDeleteLockedVolumesSubmit = async () => {
        try {
            await deleteLockedVolumes();
            createNotification({
                text: c('Notification').t`Your old files will be deleted in 72 hours`,
            });
            onSuccess?.();
        } catch (e) {
            onError?.();
        }
    };

    const handleResolveMethodSelection = (type: LockedVolumeResolveMethod) => {
        switch (type) {
            case LockedVolumeResolveMethod.ResolveMethodSelection:
                void showKeyReactivationModal({
                    onSubmit: handleResolveMethodSelection,
                    defaultResolveMethod: lastResolveMethod.current,
                    volumeCount: lockedVolumesCount,
                });
                break;
            case LockedVolumeResolveMethod.DeleteOldFiles:
                void showDeleteLockedVolumesConfirmModal({
                    onSubmit: handleDeleteLockedVolumesSubmit,
                    volumeCount: lockedVolumesCount,
                });
                break;
            case LockedVolumeResolveMethod.ReactivateKeys:
                void showUnlockDriveConfirmationDialog();
                break;
            case LockedVolumeResolveMethod.UnlockLater:
                onSuccess?.();
                break;
            default:
                break;
        }
    };

    const openKeyReactivationModal = () => {
        void handleResolveMethodSelection(LockedVolumeResolveMethod.ResolveMethodSelection);
    };

    return {
        openKeyReactivationModal,
        keyReactivationModal,
        deleteLockedVolumesConfirmModal,
        unlockDriveConfirmationDialog,
    };
};

export default useResolveLockedSharesFlow;
