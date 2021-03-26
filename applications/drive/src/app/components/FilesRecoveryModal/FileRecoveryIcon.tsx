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
            getSharesReadyToRestore(possibleKeys, lockedShareIds).then(cache.setSharesReadyToRestore);
        },
        [cache.lockedShares]
    );

    useEffect(() => {
        if (addressesKeys) {
            getReadyToRestoreData(addressesKeys);
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
