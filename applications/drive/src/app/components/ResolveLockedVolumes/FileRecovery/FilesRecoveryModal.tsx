import { c } from 'ttag';

import { ModalTwo, useLoading, useNotifications } from '@proton/components';

import { useLockedVolume } from '../../../store';
import FilesRecoveryState from './FilesRecoveryState';
import { useModal } from '../../../hooks/util/useModal';

interface Props {
    onClose?: () => void;
}

const FilesRecoveryModal = ({ onClose, ...rest }: Props) => {
    const { isOpen, onClose: handleClose } = useModal();
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
        <ModalTwo onClose={handleClose} open={isOpen} {...rest}>
            <FilesRecoveryState recovering={recovering} onRecovery={handleRecoveryClick} onClose={onClose} />
        </ModalTwo>
    );
};

export default FilesRecoveryModal;
