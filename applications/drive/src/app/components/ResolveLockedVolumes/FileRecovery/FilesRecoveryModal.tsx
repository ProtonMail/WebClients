import { c } from 'ttag';

import { ModalStateProps, ModalTwo, useLoading, useNotifications } from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';

import { useLockedVolume } from '../../../store';
import FilesRecoveryState from './FilesRecoveryState';

const FilesRecoveryModal = ({ onClose, open }: ModalStateProps) => {
    const { restoreVolumes } = useLockedVolume();
    const [recovering, withRecovering] = useLoading();
    const { createNotification } = useNotifications();

    const handleRecoveryClick = async () => {
        await withRecovering(
            restoreVolumes(new AbortController().signal)
                .then(() => {
                    createNotification({
                        text: c('Success').t`Recovery has started`,
                    });
                })
                .catch(() => onClose?.())
        );

        onClose?.();
    };

    return (
        <ModalTwo onClose={onClose} open={open}>
            <FilesRecoveryState recovering={recovering} onRecovery={handleRecoveryClick} onClose={onClose} />
        </ModalTwo>
    );
};

export default FilesRecoveryModal;

export const useFilesRecoveryModal = () => {
    return useModalTwo<void, void>(FilesRecoveryModal);
};
