import React, { useEffect, useCallback } from 'react';
import { c } from 'ttag';

import {
    AppLink,
    InlineLinkButton,
    TopBanner,
    useModals,
    useAddressesKeys,
    useUser,
    useLoading,
} from 'react-components';
import { APPS } from 'proton-shared/lib/constants';
import { Address, DecryptedKey } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import FilesRecoveryModal from './FilesRecoveryModal';
import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import useDrive from '../../hooks/drive/useDrive';

interface Props {
    onClose: () => void;
}

const FileRecoveryBanner = ({ onClose }: Props) => {
    const cache = useDriveCache();
    const { createModal } = useModals();
    const [User] = useUser();
    const [addressesKeys] = useAddressesKeys();
    const [loading, withLoading] = useLoading(true);
    const { getSharesReadyToRestore } = useDrive();

    const getReadyToRestoreData = useCallback(
        (
            addressesKeys: {
                address: Address;
                keys: DecryptedKey[];
            }[]
        ) => {
            const possibleKeys = addressesKeys.reduce((result: DecryptedKey[], { address, keys }) => {
                return [
                    ...result,
                    ...address.Keys.map((nonPrimaryKey) => keys.find((key) => key.ID === nonPrimaryKey.ID)).filter(
                        isTruthy
                    ),
                ];
            }, []);

            const lockedShareIds = cache.lockedShares.map(({ ShareID }) => ShareID);
            return getSharesReadyToRestore(possibleKeys, lockedShareIds).then(cache.setSharesReadyToRestore);
        },
        [cache.lockedShares]
    );

    useEffect(() => {
        if (addressesKeys) {
            withLoading(getReadyToRestoreData(addressesKeys)).catch(console.error);
        }
    }, [User.Email, addressesKeys, getReadyToRestoreData]);

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
        .jt`Some of your files are no longer accessible. Restore the access to your files. ${startRecoveryButton}`;

    return !loading && cache.lockedShares.length ? (
        <TopBanner className="bg-danger" onClose={onClose}>
            {cache.sharesReadyToRestore.length ? recoveryMessage : reactivateMessage}
        </TopBanner>
    ) : null;
};

export default FileRecoveryBanner;
