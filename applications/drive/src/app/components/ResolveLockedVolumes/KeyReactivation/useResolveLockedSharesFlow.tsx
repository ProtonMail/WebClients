import React, { useEffect, useRef, useState } from 'react';
import { c } from 'ttag';

import { useModals, useNotifications } from '@proton/components';

import DeleteLockedVolumesConfirmModal from './DeleteLockedVolumesConfirmModal';
import UnlockDriveConfirmationDialog from './UnlockDriveConfirmationDialog';
import KeyReactivationModal from './LockedVolumesResolveMethodModal';
import useFiles from '../../../hooks/drive/useFiles';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import { LockedVolumeResolveMethod } from './interfaces';

interface ReactivationParams {
    onSuccess?: () => void;
    onError?: () => void;
}

const useResolveLockedSharesFlow = ({ onSuccess, onError }: ReactivationParams) => {
    const lastResolveMethod = useRef<LockedVolumeResolveMethod>(LockedVolumeResolveMethod.ReactivateKeys);
    const currentModalRef = useRef<string | null>(null);

    const { deleteLockedVolumes } = useFiles();
    const { createModal, removeModal } = useModals();
    const { createNotification } = useNotifications();
    const cache = useDriveCache();

    const [currentModalType, setCurrentModalType] = useState<LockedVolumeResolveMethod | null>(null);
    const lockedShares = cache.get.lockedShares.filter((share) => !share.VolumeSoftDeleted);

    const removeCurrentModal = () => {
        if (currentModalRef.current !== null) {
            removeModal(currentModalRef.current);
            currentModalRef.current = null;
        }
    };

    const handleDeleteLockedVolumesSubmit = async () => {
        try {
            await deleteLockedVolumes(lockedShares.map((shareMeta) => shareMeta.VolumeID));
            createNotification({
                text: c('Notification').t`Your old files will be deleted in 72 hours`,
            });
            removeCurrentModal();
            onSuccess?.();
        } catch (e) {
            onError?.();
        }
    };

    const handleResolveMethodSelection = (type: LockedVolumeResolveMethod) => {
        removeCurrentModal();
        lastResolveMethod.current = type;
        setCurrentModalType(type);
    };

    const handleBackButtonClick = () => {
        removeCurrentModal();
        setCurrentModalType(LockedVolumeResolveMethod.ResolveMethodSelection);
    };

    useEffect(() => {
        if (currentModalType === null) {
            return;
        }

        const lockedVolumesCount = lockedShares.length;

        switch (currentModalType) {
            case LockedVolumeResolveMethod.ResolveMethodSelection:
                currentModalRef.current = createModal(
                    <KeyReactivationModal
                        onSubmit={handleResolveMethodSelection}
                        defaultResolveMethod={lastResolveMethod.current}
                        onClose={() => setCurrentModalType(null)}
                        volumeCount={lockedVolumesCount}
                    />
                );
                break;
            case LockedVolumeResolveMethod.DeleteOldFiles:
                currentModalRef.current = createModal(
                    <DeleteLockedVolumesConfirmModal
                        onSubmit={handleDeleteLockedVolumesSubmit}
                        onBack={handleBackButtonClick}
                        onClose={() => setCurrentModalType(null)}
                        volumeCount={lockedVolumesCount}
                    />
                );
                break;
            case LockedVolumeResolveMethod.ReactivateKeys:
                currentModalRef.current = createModal(
                    <UnlockDriveConfirmationDialog
                        onBack={handleBackButtonClick}
                        onClose={() => setCurrentModalType(null)}
                    />
                );
                break;
            case LockedVolumeResolveMethod.UnlockLater:
                setCurrentModalType(null);
                onSuccess?.();
                break;
            default:
                break;
        }
    }, [currentModalType]);

    const openKeyReactivationModal = () => {
        lastResolveMethod.current = LockedVolumeResolveMethod.ReactivateKeys;
        removeCurrentModal();
        setCurrentModalType(LockedVolumeResolveMethod.ResolveMethodSelection);
    };

    return {
        openKeyReactivationModal,
    };
};

export default useResolveLockedSharesFlow;
