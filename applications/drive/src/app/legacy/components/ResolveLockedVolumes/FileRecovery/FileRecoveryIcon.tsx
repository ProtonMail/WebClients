import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useModalTwoStatic } from '@proton/components';
import { IcFire } from '@proton/icons/icons/IcFire';

import { useLockedVolume } from '../../../../legacy/store';
import FilesRecoveryModal from '../../modals/FilesRecoveryModal/FilesRecoveryModal';

interface Props {
    className?: string;
}

const FileRecoveryIcon = ({ className }: Props) => {
    const [fileRecoveryModal, showFileRecoveryModal] = useModalTwoStatic(FilesRecoveryModal);
    const { hasVolumesForRestore } = useLockedVolume();

    return hasVolumesForRestore ? (
        <>
            <Tooltip title={c('Title').t`You have inaccessible files`}>
                <IcFire
                    color="red"
                    className={className}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        showFileRecoveryModal({});
                    }}
                />
            </Tooltip>
            {fileRecoveryModal}
        </>
    ) : null;
};

export default FileRecoveryIcon;
