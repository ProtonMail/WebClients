import React from 'react';
import { c } from 'ttag';

import { Icon, Tooltip, useModals } from 'react-components';

import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import FilesRecoveryModal from './FilesRecoveryModal';

interface Props {
    className?: string;
}

const FileRecoveryIcon = ({ className }: Props) => {
    const cache = useDriveCache();
    const { createModal } = useModals();

    return cache.sharesReadyToRestore.length ? (
        <Tooltip title={c('Title').t`You have inaccessible files`}>
            <Icon
                color="red"
                name="spam"
                className={className}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    createModal(<FilesRecoveryModal lockedShareList={cache.sharesReadyToRestore} />);
                }}
            />
        </Tooltip>
    ) : null;
};

export default FileRecoveryIcon;
