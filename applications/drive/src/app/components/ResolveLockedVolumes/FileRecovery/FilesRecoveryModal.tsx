import { c } from 'ttag';

import { DialogModal, useLoading, useNotifications } from '@proton/components';

import { useLockedVolume } from '../../../store';
import FilesRecoveryState from './FilesRecoveryState';

interface Props {
    onClose?: () => void;
}

const FilesRecoveryModal = ({ onClose, ...rest }: Props) => {
    const modalTitleID = 'files-recovery-modal';

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
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <FilesRecoveryState recovering={recovering} onRecovery={handleRecoveryClick} onClose={onClose} />
        </DialogModal>
    );
};

export default FilesRecoveryModal;
