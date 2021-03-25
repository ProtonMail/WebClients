import React, { useEffect, useCallback } from 'react';
import { c } from 'ttag';

import { Icon, Tooltip, useAddressesKeys, useModals, useUser } from 'react-components';
import { Address, DecryptedKey } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { useDriveCache } from '../DriveCache/DriveCacheProvider';
import FilesRecoveryModal from './FilesRecoveryModal';
import useDrive from '../../hooks/drive/useDrive';

interface Props {
    className?: string;
}

const FileRecoveryIcon = ({ className }: Props) => {
    const cache = useDriveCache();
    const [User] = useUser();
    const [addressesKeys] = useAddressesKeys();
    const { getSharesReadyToRestore } = useDrive();
    const { createModal } = useModals();

    const getReadyToRestoreData = useCallback(
        (address: Address, keys: DecryptedKey[]) => {
            const nonPrimaryKeys = address.Keys.filter((key) => key.Primary === 0)
                .map((nonPrimaryKey) => keys.find((key) => key.ID === nonPrimaryKey.ID))
                .filter(isTruthy);
            const lockedShareIds = cache.lockedShares.map(({ ShareID }) => ShareID);

            getSharesReadyToRestore(nonPrimaryKeys, lockedShareIds).then(cache.setSharesReadyToRestore);
        },
        [cache.lockedShares]
    );

    useEffect(() => {
        if (addressesKeys) {
            const userAddress = addressesKeys.find(({ address }) => address.Email === User.Email);
            if (userAddress) {
                getReadyToRestoreData(userAddress.address, userAddress.keys);
            }
        }
    }, [User.Email, addressesKeys, getReadyToRestoreData]);

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
