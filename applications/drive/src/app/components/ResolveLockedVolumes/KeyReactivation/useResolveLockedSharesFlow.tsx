import React, { useEffect, useRef, useState } from 'react';
import { c } from 'ttag';

import { useModals, useNotifications } from '@proton/components';

import { useLockedVolume } from '../../../store';
import DeleteLockedVolumesConfirmModal from './DeleteLockedVolumesConfirmModal';
import UnlockDriveConfirmationDialog from './UnlockDriveConfirmationDialog';
import KeyReactivationModal from './LockedVolumesResolveMethodModal';
import { LockedVolumeResolveMethod } from './interfaces';

interface ReactivationParams {
    onSuccess?: () => void;
    onError?: () => void;
}

const useResolveLockedSharesFlow = ({ onSuccess, onError }: ReactivationParams) => {
    const lastResolveMethod = useRef<LockedVolumeResolveMethod>(LockedVolumeResolveMethod.ReactivateKeys);
    const currentModalRef = useRef<string | null>(null);

    const { lockedVolumesCount, deleteLockedVolumes } = useLockedVolume();
    const { createModal, removeModal } = useModals();
    const { createNotification } = useNotifications();

    const [currentModalType, setCurrentModalType] = useState<LockedVolumeResolveMethod | null>(null);

    const removeCurrentModal = () => {
        if (currentModalRef.current !== null) {
            removeModal(currentModalRef.current);
            currentModalRef.current = null;
        }
    };

    const handleDeleteLockedVolumesSubmit = async () => {
        try {
            await deleteLockedVolumes();
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
