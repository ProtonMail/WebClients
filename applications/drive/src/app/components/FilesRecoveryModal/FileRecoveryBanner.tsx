import React from 'react';
import { c } from 'ttag';

import { AppLink, InlineLinkButton, TopBanner, useModals } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

import FilesRecoveryModal from './FilesRecoveryModal';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';

interface Props {
    onClose: () => void;
}

const FileRecoveryBanner = ({ onClose }: Props) => {
    const cache = useDriveCache();
    const { createModal } = useModals();

    const mailSettingsLink = (
        <AppLink
            key="link-to-mail-settings"
            to="/settings/security#addresses"
            toApp={APPS.PROTONMAIL}
            target="_blank"
        >{c('Info').t`More`}</AppLink>
    );

    const startRecoveryButton = (
        <InlineLinkButton
            key="file-recovery-more"
            onClick={() => {
                createModal(<FilesRecoveryModal lockedShareList={cache.sharesReadyToRestore} />);
            }}
        >
            {c('Info').t`More`}
        </InlineLinkButton>
    );

    const reactivateMessage = c('Info')
        .jt`Your files are no longer accessible due to a password reset. Re-upload the old encryption key to regain the access. ${mailSettingsLink}`;
    const recoveryMessage = c('Info')
        .jt`Your files are no longer accessible due to a password reset. Restore old volume to regain the access. ${startRecoveryButton}`;

    return cache.lockedShares.length ? (
        <TopBanner className="bg-danger" onClose={onClose}>
            {cache.sharesReadyToRestore.length ? recoveryMessage : reactivateMessage}
        </TopBanner>
    ) : null;
};

export default FileRecoveryBanner;
