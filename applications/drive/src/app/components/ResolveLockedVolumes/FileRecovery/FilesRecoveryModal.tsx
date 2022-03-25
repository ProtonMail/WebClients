import { c } from 'ttag';

import { ModalTwo, useLoading, useNotifications } from '@proton/components';

import { useLockedVolume } from '../../../store';
import FilesRecoveryState from './FilesRecoveryState';

interface Props {
    onClose?: () => void;
    open?: boolean;
}

const FilesRecoveryModal = ({ onClose, open }: Props) => {
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
