import React, { useEffect, useRef, useState } from 'react';
import { c } from 'ttag';

import { useModals, useNotifications } from '@proton/components';

import DeleteOldFilesConfirmModal from './DeleteLockedVolumesConfirmModal';
import UnlockDriveConfirmationDialog from './UnlockDriveConfirmationDialog';
import KeyReactivationModal, { LockedVolumeResolveMethod } from './LockedVolumesResolveMethodModal';
import useFiles from '../../../hooks/drive/useFiles';

interface ReactivationParams {
    onSuccess?: () => void;
    onError?: () => void;
}

const useKeyReactivationFlow = ({ onSuccess, onError }: ReactivationParams) => {
    const lastResolveMethod = useRef<LockedVolumeResolveMethod>(LockedVolumeResolveMethod.ReactivateKeys);
    const volumesToDelete = useRef<string[]>([]);

    const { deleteOldFiles } = useFiles();
    const { createModal, removeModal } = useModals();
    const { createNotification } = useNotifications();

    const [currentModalType, setCurrentModalType] = useState<LockedVolumeResolveMethod | null>(null);
    const currentModalRef = useRef<string | null>(null);

    const removeCurrentModal = () => {
        if (currentModalRef.current !== null) {
            removeModal(currentModalRef.current);
            currentModalRef.current = null;
        }
    };

    const handleConfirmation = async () => {
        try {
            await deleteOldFiles(volumesToDelete.current);
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

        const volumeCount = volumesToDelete.current.length;

        switch (currentModalType) {
            case LockedVolumeResolveMethod.ResolveMethodSelection:
                currentModalRef.current = createModal(
                    <KeyReactivationModal
                        onSubmit={handleResolveMethodSelection}
                        defaultResolveMethod={lastResolveMethod.current}
                        onClose={() => setCurrentModalType(null)}
                        volumeCount={volumeCount}
                    />
                );
                break;
            case LockedVolumeResolveMethod.DeleteOldFiles:
                currentModalRef.current = createModal(
                    <DeleteOldFilesConfirmModal
                        onSubmit={handleConfirmation}
                        onBack={handleBackButtonClick}
                        onClose={() => setCurrentModalType(null)}
                        volumeCount={volumeCount}
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

    const openKeyReactivationModal = (volumeIds: string[]) => {
        volumesToDelete.current = volumeIds;
        lastResolveMethod.current = LockedVolumeResolveMethod.ReactivateKeys;
        setCurrentModalType(null);
        setCurrentModalType(LockedVolumeResolveMethod.ResolveMethodSelection);
    };

    return {
        openKeyReactivationModal,
    };
};

export default useKeyReactivationFlow;
