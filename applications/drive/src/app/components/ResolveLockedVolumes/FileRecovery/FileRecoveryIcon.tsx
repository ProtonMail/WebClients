import { c } from 'ttag';

import { Icon, Tooltip, useModals } from '@proton/components';

import { useLockedVolume } from '../../../store';
import FilesRecoveryModal from './FilesRecoveryModal';

interface Props {
    className?: string;
}

const FileRecoveryIcon = ({ className }: Props) => {
    const { createModal } = useModals();
    const { hasVolumesForRestore } = useLockedVolume();

    return hasVolumesForRestore ? (
        <Tooltip title={c('Title').t`You have inaccessible files`}>
            <Icon
                color="red"
                name="fire"
                className={className}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    createModal(<FilesRecoveryModal />);
                }}
            />
        </Tooltip>
    ) : null;
};

export default FileRecoveryIcon;
