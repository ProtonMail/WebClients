import { c } from 'ttag';

import { DialogModal, useLoading, useNotifications } from '@proton/components';
import { ShareMeta } from '@proton/shared/lib/interfaces/drive/share';

import FilesRecoveryState from './FilesRecoveryState';
import useDrive from '../../../hooks/drive/useDrive';

interface Props {
    lockedShareList: {
        lockedShareMeta: ShareMeta;
        decryptedPassphrase: any;
    }[];
    onClose?: () => void;
}

const FilesRecoveryModal = ({ lockedShareList, onClose, ...rest }: Props) => {
    const modalTitleID = 'files-recovery-modal';

    const { restoreVolumes } = useDrive();
    const [recovering, withRecovering] = useLoading();
    const { createNotification } = useNotifications();

    const handleRecoveryClick = async () => {
        await withRecovering(
            restoreVolumes(lockedShareList)
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
