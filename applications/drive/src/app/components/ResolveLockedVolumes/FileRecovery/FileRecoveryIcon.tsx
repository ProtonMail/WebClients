import { c } from 'ttag';

import { Icon, useModalTwoStatic } from '@proton/components'
import { Tooltip } from '@proton/atoms';

import { useLockedVolume } from '../../../store';
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
                <Icon
                    color="red"
                    name="fire"
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
